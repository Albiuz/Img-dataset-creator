from project import create_app
from project import db
from project.models import Class_tag

if __name__ == '__main__':
    create_app().run(host='192.168.1.246', port=5000, debug=True)
