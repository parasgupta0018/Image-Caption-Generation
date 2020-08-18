import sys
import json
import requests
import cv2
import time
#import urllib3 as urllib
from PIL import Image as Img
from skimage import io
from io import BytesIO
import numpy as np
import base64
import urllib.request as urllib
#import pandas as pd
import glob
import os
from keras.preprocessing.sequence import pad_sequences
from keras.preprocessing.text import Tokenizer
from keras.models import Model, load_model
from keras.layers import Flatten, Dense, LSTM, Dropout, Embedding, Activation
from keras.layers import concatenate, BatchNormalization, Input,GlobalAveragePooling2D
from keras.layers.merge import add
from keras.utils import to_categorical
from keras.applications.inception_v3 import InceptionV3, preprocess_input
from keras.utils import plot_model
import matplotlib.pyplot as plt
import string
import time
import fileinput
import validators

#url = 'https://scikit-image.org/_images/coins-small.png'

# img = 'https://football-observatory.com/IMG/sites/b5wp/2019/wp299/en/img/wp299.jpg'
img = str(sys.argv[1])
#url = str(sys.argv[1])
#img='./public/uploads/wp299:633babda5fd6398301ab6517c61b7730bb3feef1.jpg'

model = load_model('bdrlstm200')

train_pth = './flickr8k_data/Flickr_8k.trainImages.txt'
test_pth = './flickr8k_data/Flickr_8k.testImages.txt'

img_pth = '/content/Flickr_Data/Flickr_Data/Images/'
trainset = open(train_pth, 'r', encoding = 'utf-8').read().split("\n")
train_img = []
for im in glob.glob(img_pth+'*.jpg'):
    if im.split('/')[-1] in trainset:
        train_img.append(im)
testset = open(test_pth, 'r', encoding = 'utf-8').read().split("\n")
test_img = []
for im in glob.glob(img_pth+'*.jpg'):
    if im.split('/')[-1] in testset:
        test_img.append(im)

caps_pth = './flickr8k_data/Flickr8k.token.txt'
caps  = open(caps_pth, 'r', encoding = 'utf-8').read()

def load_caps(caps):
    captions = dict()
    for cap in caps.split("\n"):
        token = cap.split("\t")
        if len(cap) < 2:
            continue
        img_id = token[0].split('.')[0]
        img_cap = token[1]
        if img_id not in captions:
            captions[img_id] = []
        captions[img_id].append(img_cap)
    return captions

captions = load_caps(caps)
from gensim.parsing.preprocessing import remove_stopwords,strip_numeric,strip_punctuation,strip_short
def clean_caps(caps):
    for key, cap in caps.items():
        for i in range(len(cap)):
            caption = cap[i]
            caption = caption.lower()
            caption = strip_punctuation(caption)
            caption = strip_numeric(caption)
            caption = strip_short(caption,2)
            cap[i] = caption

clean_caps(captions)
def load_clean_descriptions(caps, data):
    dat = dict()
    for key, cap in caps.items():
        if key+'.jpg' in data:
            if key not in dat:
                dat[key] = []
            for line in cap:
                c = line
                dat[key].append(c)
    return dat
train_caps = load_clean_descriptions(captions, trainset)
test_caps = load_clean_descriptions(captions, testset)

def greedy_search(pic):
    start = '<start>'
    maxm=33
    for i in range(maxm):
        seq = [word_to_idx[word] for word in start.split() if word in word_to_idx]
        seq = pad_sequences([seq], maxlen = maxm)
        yhat = model.predict([pic, seq])
        yhat = np.argmax(yhat)
        word = idx_to_word[yhat]
        start += ' ' + word
        if word == '<end>':
            break
    final = start.split()
    final = final[1:-1]
    final = ' '.join(final)
    return final

word_to_idx = {}

idx_to_word = {}

def to_vocab(cap):
    words = set()
    for key in cap.keys():
        for line in cap[key]:
            words.update(line.split())
    return words
vocab = to_vocab(captions)
len(vocab)

train_captions = []
for key, caps in train_caps.items():
    for cap in caps:
        train_captions.append(cap)
        
vocabulary = vocab
thresh = 10
word_counts = {}
for cap in train_captions:
    for word in cap.split(' '):
        word_counts[word] = word_counts.get(word, 0) + 1

vocab = [word for word in word_counts if word_counts[word] >= thresh]

for idx,word in enumerate(vocab):
    word_to_idx[word] = idx+1
    idx_to_word[idx+1] = word


def imageurl(url):
    response = requests.get(url)
    img = Img.open(BytesIO(response.content))
    img_array = np.array(img)
    img_array = cv2.resize(img_array,(299,299))
    return img_array

base_model = InceptionV3(weights = 'imagenet',input_shape = (299,299,3))

x = base_model.layers[-2]
encoder = Model(base_model.inputs,x.output)

from keras.preprocessing import image, sequence
from IPython.display import Image, display

def isBase64(s):
    try:
        return base64.b64encode(base64.b64decode(s)).decode('utf-8') == s
    except Exception:
        return False


def stringToRGB(base64_string):
    imgdata = base64.b64decode(str(base64_string))
    #return imgdata
    image = Image.open(BytesIO(imgdata))
    return cv2.cvtColor(np.array(image), cv2.COLOR_BGR2RGB)


# if valid==True:
#     print("Url is valid")
# else:
#     print("Invalid url")

def preprocessing(img_path):
    im = image.load_img(img_path, target_size=(299,299,3))
    im = image.img_to_array(im)
    #print(im)
    im = np.expand_dims(im, axis=0)
    return im

def preprocessing2(img_path):
    if validators.url(img_path):
        im = imageurl(img_path)
    else:
        im = image.load_img(img_path, target_size=(299,299,3))
        im = image.img_to_array(im)
    
    im = np.expand_dims(im, axis=0)
    return im

def get_encoding(model, img):
    image = preprocessing(img)
    image = preprocess_input(image)
    pred = model.predict(image).reshape(1,2048)
    return pred

def get_encoding2(model, img):
    image = preprocessing2(img)
    image = preprocess_input(image)
    pred = model.predict(image).reshape(1,2048)
    return pred

#img = 'https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2019/12/03202400/Yellow-Labrador-Retriever.jpg'
#test_img = get_encoding(resnet, img)
test_img2 = get_encoding2(encoder,img)

#out = greedy_search(test_img)
out2 = greedy_search(test_img2).capitalize()

# z = Image(filename=img)
# display(z)

#print(out)
print(out2)
sys.stdout.flush()



def getImgArray(array):    
    if isBase64(url):
        #print('--------base64------------------')
        img_array = stringToRGB(url)
        cv2.imshow('base64-image',img_array)
        cv2.waitKey(0)
        print('ho gya base64')
        #print('base64 : ',img_array)
        # imgcv = cv2.imread('public/images/test.png')
        # #print('imread : ',imgcv)
        # if (img_array==imgcv).all():
        #     print('same hai base64')
        # else:
        #     print('nai base64')
        
    else:
        print('url')
        # response = requests.get(url)
        # img = Image.open(BytesIO(response.content))
        # img_array = np.array(img)
        # cv2.imshow('url-image',img_array)
        # cv2.waitKey(0)
        # print('ho gya url')

        # imgcv = cv2.imread('public/images/coins-small.png', 0)
        
        #print(img_array)
        #print('..............opencv...................')
        #print(imgcv)
        # if (img_array==imgcv).all():
        #     print('same hai opencv')
        # else:
        #     print('nai opencv')


# print(type(url))

# cv2.imshow('image from cv2',imgcv)
# cv2.imshow("Image from PIL", img_array)

