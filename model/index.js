const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");

const model = tf.loadGraphModel(
    `http://localhost:${process.env.PORT || 3000}/pokemon_model/model.json`
);

const convertImage = (imageBuffer) => {
    return (tensor = tf.node
        .decodeImage(imageBuffer, 3)
        .resizeNearestNeighbor([256, 256])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims());
};

const getBase64 = (url) => {
    return axios
        .get(
            url,
            {
                responseType: "arraybuffer",
            },
            { timeout: 60 }
        )
        .then((response) => {
            // console.log(response);
            return Buffer.from(response.data, "binary").toString("base64");
        });
};

const convertDataURIToBinary = (dataURI) => {
    return (base64Decode = Buffer.from(dataURI, "base64"));
};

let top1 = (predictions) => {
    return tf.argMax(predictions, 1);
};

let topk = (predictions, k) => {
    return tf.topk(predictions, k);
};

let top5 = (predictions) => {
    return Array.from(predictions)
        .map(function (p, i) {
            return {
                probability: p,
                // className: IMAGENET_CLASSES[i],
            };
        })
        .sort(function (a, b) {
            return b.probability - a.probability;
        })
        .slice(0, 5);
};

exports.getBase64 = getBase64;
exports.model = model;
exports.top1 = top1;
exports.top5 = top5;
exports.topk = topk;
exports.convertImage = convertImage;
exports.convertDataURIToBinary = convertDataURIToBinary;
