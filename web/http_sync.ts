/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {parseUrl} from '@tensorflow/tfjs-core/dist/io/http';
import {concatenateArrayBuffers, LoadOptions, ModelArtifacts, ModelJSON, WeightsManifestEntry} from '@tensorflow/tfjs-core/dist/io/io';
import {IOHandlerSync, WeightsManifestConfig} from '@tensorflow/tfjs-core/dist/io/types';


function fetchSync(path: string, requestInit?: RequestInit) {
  const request = new XMLHttpRequest();
  request.open(requestInit?.method || 'GET', path, false);
  // This is a hack to prevent non-ascii characters from being mangled.
  // Even though we're not necessarily loading text, XMLHttpRequest thinks
  // we are.
  request.overrideMimeType('text/plain; charset=x-user-defined');
  request.send(null);
  return {
    ok: request.status === 200,
    status: request.status,
    arrayBuffer: () => {
      return Uint8Array.from(request.response as string,
                             c => c.charCodeAt(0)).buffer;
    },
    json: () => JSON.parse(request.responseText) as unknown,
  };
}

/**
 * A TFJS IOHandlerSync based on a synchronous XMLHttpRequest.
 *
 * This function uses the same model format as the async IOHandlers, so
 * it first loads the model's JSON file, reads the weights manifest, and then
 * loads the weights. This is inefficient because it has to load the weights one
 * at a time (since it's synchronous).
 *
 * This class could be adapted to use a different, more efficient format. For
 * example, using JSZip (https://stuk.github.io/jszip/), it may be possible
 * to zip all the model files into a single archive and load them all at once.
 */
export class HTTPRequestSync implements IOHandlerSync {
  constructor(private path: string, private loadOptions?: LoadOptionsSync) { }

  load() {
    const modelConfigRequest = fetchSync(this.path,
        this.loadOptions?.requestInit);

    if (!modelConfigRequest.ok) {
      throw new Error(
          `Request to ${this.path} failed with status code ` +
          `${modelConfigRequest.status}. Please verify this URL points to ` +
          `the model JSON of the model to load.`);
    }

    const modelJSON = modelConfigRequest.json() as ModelJSON;
    const modelTopology = modelJSON.modelTopology;
    const weightsManifest = modelJSON.weightsManifest;
    if (modelTopology == null && weightsManifest == null) {
      throw new Error(
          `The JSON from HTTP path ${this.path} contains neither model ` +
          `topology or manifest for weights.`);
    }

    const modelArtifacts = modelJSON as ModelArtifacts;
    if (modelJSON.weightsManifest != null) {
      const [weightSpecs, weightData] =
        this.loadWeights(modelJSON.weightsManifest);
      modelArtifacts.weightSpecs = weightSpecs;
      modelArtifacts.weightData = weightData;

    }
    return modelArtifacts;
  }

  private loadWeights(weightsManifest: WeightsManifestConfig):
      [WeightsManifestEntry[], ArrayBuffer] {
    const weightPath = Array.isArray(this.path) ? this.path[1] : this.path;
    const [prefix, suffix] = parseUrl(weightPath);
    const pathPrefix = this.loadOptions?.weightPathPrefix || prefix;
        const weightSpecs = [];
    for (const entry of weightsManifest) {
      weightSpecs.push(...entry.weights);
    }

    const fetchURLs: string[] = [];
    const urls: string[] = [];
    const weightUrlConverter = this.loadOptions?.weightUrlConverter
      || ((path: string): string => pathPrefix + path + suffix);

    for (const weightsGroup of weightsManifest) {
      for (const path of weightsGroup.paths) {
        fetchURLs.push(weightUrlConverter(path));
      }
    }

    if (this.loadOptions?.weightUrlConverter) {
      fetchURLs.push(...urls);
    }

    const buffers = loadWeightsAsArrayBufferSync(
      fetchURLs, this.loadOptions?.requestInit);
    return [weightSpecs, concatenateArrayBuffers(buffers)];
  }
}

/**
 * Synchronously reads binary weights data from a number of URLs.
 *
 * @param fetchURLs URLs to send the HTTP requests at, using synchronous
 * `fetch` calls.
 * @param requestOptions RequestInit (options) for the HTTP requests.
 * @returns An Array of `ArrayBuffer`. The Array has the same
 *   length as `fetchURLs`.
 */
function loadWeightsAsArrayBufferSync(fetchURLs: string[],
  requestOptions: RequestInit = {}): ArrayBuffer[] {
  const responses = fetchURLs.map(
      fetchURL =>
      fetchSync(fetchURL, requestOptions));
  return responses.map(response => response.arrayBuffer());
}


type LoadOptionsSync = Omit<LoadOptions, 'weightUrlConverter'|'onProgress'> & {
  weightUrlConverter?: (weightFileName: string) => string;
};

export function httpSync(path: string, loadOptions?: LoadOptionsSync):
IOHandlerSync {
  return new HTTPRequestSync(path, loadOptions);
}
