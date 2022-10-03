const tf = require('@tensorflow/tfjs');
const tfn = require('@tensorflow/tfjs-node');

async function main() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 32, inputShape: [1], trainable: true}),
      tf.layers.dense({units: 1, trainable: true }),
      tf.layers.activation({ activation: 'relu' }),
    ]
  });

  console.log(model.input);

  model.compile({
    loss: 'meanSquaredError',
    //loss: 'categoricalCrossentropy',
    optimizer: 'sgd',
    metrics: ['accuracy'],
  });

  const data = tf.tensor1d([1, 2, 3, 4]).reshape([4,1]);
  const labels = tf.tensor1d([2, 4, 6, 8]).reshape([4,1]);

  for (let i = 0; i < 1000; i++) {
  //await model.fit(data, labels, {stepsPerEpoch: 1000});
    await model.fit(data, labels);
  }
  console.log(await model.fit(data, labels));

  model.predict(tf.tensor1d([1,2,3,4,5,6])).print();
  await model.save(tfn.io.fileSystem('double-model'));
}

main();
