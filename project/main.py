# main.py
import os
from flask import Blueprint, render_template, request, send_from_directory, url_for
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from PIL import Image, ImageOps

from .models import ImgFile as DB_ImgFile
from .models import BBox as DB_BBox
from .models import Class_tag as DB_Class_tag
from . import db

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')


@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html', name=current_user.name)


@main.route('/img_captured.html')
@login_required
def img_captured():
    return render_template('img_captured.html')


@main.route('/img_collected', methods=['GET'])
@login_required
def img_collected():

    checked_arg = '0' # set to '0' if checked is not in request
    if 'checked' in request.args:
        checked_arg = request.args['checked']

    # show img collected - use query filter to show only unchecked imgs
    img_db_records = current_user.images.filter(DB_ImgFile.is_checked==checked_arg)
    #img_db_records = current_user.images
    all_imgs = [record.filename for record in img_db_records]

    #numbering pages
    imgs_per_pages = 10
    number_of_page = len(all_imgs)//imgs_per_pages
    if len(all_imgs)%imgs_per_pages:
        number_of_page += 1

    curr_page = '1'
    if 'page_num' in request.args:
        curr_page = request.args['page_num']
    curr_page = int(curr_page)

    page_list = []
    if curr_page <= 3:
        page_list = [n+1 for n in range(number_of_page)][:5] # [1,|2|,3,4,5]
    elif curr_page <= number_of_page - 2:
        page_list = [n for n in range(curr_page-2, curr_page+3)] # [3,4,|5|,6,7]
    else:
        page_list = [n+1 for n in range(number_of_page)][-5:] # [3,4,5,6,|7|]

    start = (curr_page-1) * imgs_per_pages
    stop = start + imgs_per_pages
    imgs = all_imgs[start:stop]

    return render_template('img_collected.html', imgs=imgs, checked=checked_arg ,curr_page=curr_page, page_list=page_list)


@main.route('/storage')
@login_required
def storage():
    # get image from folder
    filename = secure_filename(request.args['file'])
    path = os.path.join(os.path.dirname(__file__), 'uploads', current_user.nameDir, 'thumbnail')
    return send_from_directory(path, filename=filename, as_attachment=True)


@main.route('/img_bbox', methods=['GET', 'POST'])
@login_required
def img_bbox():
    if request.method == 'POST':
        data_recived = request.get_json()
        filename = data_recived['filename']
        img_rec = current_user.images.filter(DB_ImgFile.filename == filename).first()
        # find the next image record in the current group checked/no_checked
        curr_checked_state = 1 if img_rec.is_checked else 0
        next_img_rec = current_user.images.filter(DB_ImgFile.id > img_rec.id, DB_ImgFile.is_checked == curr_checked_state).first()

        img_rec.is_checked = True

        if 'delete' in data_recived:
            db.session.delete(img_rec)
            #remove img from folder

        else:
            for bbox in img_rec.bboxs: # remove all old bboxs
                db.session.delete(bbox) # to avoid this add a is_modified varaible
                                        # in javascript hold old value and new value, if old_v != new_v -> is_modified=true

            bboxs_recived = data_recived['obj']
            if bboxs_recived:
                img_rec.is_labeled = True

                for bbox in bboxs_recived: # add new bbox
                    class_tag_id = bbox['class_tag_id']
                    x = bbox['x']
                    y = bbox['y']
                    width = bbox['width']
                    height = bbox['height']
                    img_rec.bboxs.append(DB_BBox(class_tag_id=class_tag_id,
                                                x=x,
                                                y=y,
                                                width=width,
                                                height=height))

        db.session.commit()

        if next_img_rec:
            return url_for('main.img_bbox', img=next_img_rec.filename)
        else:
            return url_for('main.img_collected', checked=curr_checked_state)

    elif request.method == 'GET':
        img = request.args['img']
        #img_rec = image record from database
        img_rec = current_user.images.filter(DB_ImgFile.filename==img).first()

        json_dict = {}
        json_dict['classes'] = [{'id':rec.id, 'name':rec.name} for rec in DB_Class_tag.query.all()]
        # in future: use ratio value.
        json_dict['size'] = {'width' : img_rec.thumb_width, 'height' : img_rec.thumb_height}
        json_dict['obj'] = [{'class_tag_id' : bbox.class_tag_id,
                            'x' : bbox.x,
                            'y' : bbox.y,
                            'width' : bbox.width,
                            'height' : bbox.height}
                            for bbox in img_rec.bboxs]

        return render_template('img_bbox.html', name=current_user.name, img=img, json_dict=json_dict)


@main.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST' and 'image' in request.files:
        # Save the file to ./uploads
        # DANGER!! -> check file dimension
        current_img_num = current_user.counterImg #int
        usr_dir = current_user.nameDir
        base_dir = os.path.dirname(__file__)
        files = request.files.getlist('image')
        current_user.counterImg = current_img_num + len(files)

        for enum, f in enumerate(files): # type(f) -> <class 'werkzeug.datastructures.FileStorage'>
            extension = f.filename.split('.')[-1] # DANGER!! check if is an allowed extension
            img_filename = "image_%s.%s" % (str(current_img_num + enum), extension)
            base_path = os.path.join(base_dir, 'uploads', usr_dir)

            img = Image.open(f)
            img = ImageOps.exif_transpose(img) #rotate image correctly. Works only whit pillow version >= 6.0.0
            w,h = img.size
            if img.mode != 'RGB': # need to prevent "OSError: cannot write mode P as JPEG"
                img = img.convert('RGB')
            img.save(os.path.join(base_path, img_filename)) # this losses exif information
            #create thumbnail of image
            img.thumbnail((540,540))
            th_w,th_h = img.size
            img.save(os.path.join(base_path,'thumbnail',img_filename))
            img.close()

            db.session.add(DB_ImgFile(user_id=current_user.id,
                                    filename=img_filename,
                                    width=w,
                                    height=h,
                                    thumb_width=th_w,
                                    thumb_height=th_h))

        db.session.commit()

               # process img in image classifier

        return 'Caricamento completato'
