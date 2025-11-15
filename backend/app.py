from flask import Flask, jsonify, render_template, request
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from config import Config
from models import User, db

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
app.config.from_object(Config)
db.init_app(app)

def init_db():
    """
    Создает таблицы в базе данных.
    """

    with app.app_context():
        db.create_all()

@app.route('/')
def index():
    """
    Главная страница приложения.
    Возвращает HTML-страницу index.html.
    """
    return render_template('index.html')

@app.route('/add_user', methods=['POST'])
def add_user():
    """
    Добавляет пользователя в базу данных.    
    Ожидает JSON-объект с данными о пользователе.
    Если данные не заданы, возвращает ошибку 400.    
    Если username или email не заданы, возвращает ошибку 400.    
    Если email уже используется, возвращает ошибку 400.    
    Если возникла ошибка при добавлении пользователя, возвращает ошибку 500.    
    Возвращает JSON-объект с сообщением о добавлении пользователя.
    """
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'Неверный JSON'}), 400
    
    username = data.get('username')
    email = data.get('email')

    if not username or not email:
        return jsonify({'error': 'Имя и email обязательны!'}), 400
    
    user = User(username=username, email=email)
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email уже используется!'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
    return jsonify({'message': 'Пользователь добавлен'}), 201

@app.route('/users', methods=['GET'])
def users():
    """
    Возвращает список всех пользователей в формате JSON-объекта.    
    JSON-объект имеет следующий формат:
    {
        "total": <int>, // Количество пользователей
        "users": [
            {
                "id": <int>, // Id пользователя
                "username": <string>, // Имя пользователя
                "email": <string> // Email пользователя
            },
            ...
        ]
    }
    
    Если возникла ошибка при получении списка пользователей,
    возвращает ошибку 500.
    """
    try:
        users_query_all = db.session.query(User).all()
        users_list_all = [user.to_dict() for user in users_query_all]
        response = {
            'total': len(users_list_all),
            'users': users_list_all
        }
        return jsonify(response)

    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>')
def user(user_id):
    """
    Возвращает информацию о пользователе по его id.    
    Если пользователя с таким id не существует, возвращает ошибку 404.    
    Возвращает JSON-объект с информацией о пользователе.
    """
    user = db.session.query(User).get(user_id)
    if user is None:
        return "Пользователя с таким id не существует", 404
    return jsonify(user.to_dict())

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
