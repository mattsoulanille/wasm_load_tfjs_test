import {parseUrl} from '@tensorflow/tfjs-core/dist/io/http';
import {concatenateArrayBuffers, LoadOptions, ModelArtifacts, ModelJSON, WeightsManifestEntry} from '@tensorflow/tfjs-core/dist/io/io';
import {IOHandlerSync, WeightsManifestConfig} from '@tensorflow/tfjs-core/dist/io/types';


function fetchSync(path: string, requestInit?: RequestInit) {
  const request = new XMLHttpRequest();
  request.open(requestInit && requestInit.method || 'GET', path, false);
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
