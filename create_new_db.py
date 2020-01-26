from project import db, create_app
from project.models import Class_tag
from flask_sqlalchemy import sqlalchemy

#create db.sqlite
app=create_app()
db.create_all(app=app)

#create rows in Class_tag table with labels
labels = ['peronospora', 'oidio', 'botrite', 'mal dell\'esca']
engine = sqlalchemy.create_engine('sqlite:///project/db.sqlite')
engine.connect()
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()
for cl in labels:
    session.add(Class_tag(name=cl))
session.commit()
