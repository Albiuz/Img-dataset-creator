# models.py

from flask_login import UserMixin
from . import db

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True) # primary keys are required by SQLAlchemy
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(1000))
    nameDir = db.Column(db.String(100))
    counterImg = db.Column(db.Integer) #counter updated by img uploader

    images = db.relationship('ImgFile', backref='user', lazy='dynamic')

class ImgFile(db.Model):
    __tablename__ = 'img_file'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    filename = db.Column(db.String(20))
    # size of original img
    width = db.Column(db.Integer)
    height = db.Column(db.Integer)
    # size of img thumbnail
    thumb_width = db.Column(db.Integer)
    thumb_height = db.Column(db.Integer)

    is_labeled = db.Column(db.Boolean, default=False)
    is_checked = db.Column(db.Boolean, default=False)

    bboxs = db.relationship('BBox', cascade='all, delete-orphan', backref='img_file')

class BBox(db.Model):
    __tablename__ = 'b_box'
    id = db.Column(db.Integer, primary_key=True)
    img_id = db.Column(db.Integer, db.ForeignKey('img_file.id'))
    #name = db.Column(db.String(50)) #delete this
    class_tag_id = db.Column(db.Integer, db.ForeignKey('class_tag.id'))
    class_tag = db.relationship('Class_tag', backref='b_box')
    # yolo notation
    x = db.Column(db.Float()) # x = absolute_x / image_width
    y = db.Column(db.Float())
    width = db.Column(db.Float()) # width = absolute_box_width / image_width
    height = db.Column(db.Float())

class Class_tag(db.Model):
    __tablename__ = 'class_tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True)
