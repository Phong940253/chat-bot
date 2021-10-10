import tensorflow as tf
from tensorflow.keras.models import load_model, save_model
from keras import backend as K

def swish_activation(x):
    return (K.sigmoid(x) * x)

keras_model_path = "./model.h5"
output_model_path = "exported-models/tf/"

def convert_keras_to_graph():
    model = load_model(keras_model_path, custom_objects={"hard_swish": swish_activation})
    model.summary()
    save_model(model, output_model_path)
    
    # check the model in tensorflow
    model = tf.saved_model.load(output_model_path)


if __name__ == "__main__":
    convert_keras_to_graph()