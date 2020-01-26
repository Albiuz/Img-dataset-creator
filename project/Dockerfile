# A dockerfile must always start by importing the base image.
# We use the keyword 'FROM' to do that.
# In our example, we want import the python image.
# So we write 'python' for the image name and 'latest' for the version.

FROM python:3.6-slim-stretch

# In order to launch our python code, we must import it into our image.
# We use the keyword 'COPY' to do that.
# The first parameter 'main.py' is the name of the file on the host.
# The second parameter '/' is the path where to put the file on the image.
# Here we put the file at the image root folder.

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN pip install Werkzeug Flask numpy Keras gevent pillow h5py tensorflow


EXPOSE 5000
CMD [ "python" , "app.py"]
