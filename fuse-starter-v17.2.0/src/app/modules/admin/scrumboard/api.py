import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify, make_response
import uuid
from flask_cors import CORS

# Database setup
DATABASE = 'scrumboard.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables with proper foreign key constraints
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            last_activity TEXT,
            owner_id TEXT,
            is_public INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES members(id) ON DELETE SET NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            avatar TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS board_members (
            board_id TEXT,
            member_id TEXT,
            joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (board_id, member_id),
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
            FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS labels (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            title TEXT NOT NULL,
            color TEXT DEFAULT '#808080',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            title TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            list_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            due_date TEXT,
            type TEXT DEFAULT 'normal',
            checklist_items TEXT,
            start_date TEXT,
            end_date TEXT,
            member TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS card_labels (
            card_id TEXT,
            label_id TEXT,
            PRIMARY KEY (card_id, label_id),
            FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id)')
    
    # Sau khi tạo bảng boards
    cursor.execute('SELECT id FROM boards WHERE title = ?', ('Daily Tasks',))
    if not cursor.fetchone():
        board_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO boards (id, title, description, icon, last_activity, is_public)
            VALUES (?, ?, ?, ?, ?, 1)
        ''', (board_id, 'Daily Tasks', 'Công việc hàng ngày cho mọi người', 'heroicons_outline:calendar', datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

# Data models
@dataclass
class Board:
    id: Optional[str] = None
    title: str = ""
    description: Optional[str] = None
    icon: Optional[str] = None
    last_activity: Optional[str] = None
    owner_id: Optional[str] = None
    lists: Optional[List[Dict[str, Any]]] = None
    labels: Optional[List[Dict[str, Any]]] = None
    members: Optional[List[Dict[str, Any]]] = None

@dataclass
class Member:
    id: Optional[str] = None
    name: str = ""
    avatar: Optional[str] = None

@dataclass
class Label:
    id: Optional[str] = None
    board_id: str = ""
    title: str = ""
    color: str = "#808080"

@dataclass
class ScrumList:
    id: Optional[str] = None
    board_id: str = ""
    title: str = ""
    position: int = 0
    cards: Optional[List[Dict[str, Any]]] = None

@dataclass
class Card:
    id: Optional[str] = None
    board_id: str = ""
    list_id: str = ""
    title: str = ""
    description: Optional[str] = None
    position: int = 0
    due_date: Optional[str] = None
    labels: Optional[List[Dict[str, Any]]] = None

# Flask app setup
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Utility functions
def generate_id():
    return str(uuid.uuid4())

def update_board_activity(board_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE boards SET last_activity = ? WHERE id = ?',
        (datetime.now().isoformat(), board_id)
    )
    conn.commit()
    conn.close()

# Board API endpoints
@app.route('/api/boards', methods=['GET'])
def get_boards():
    email = request.args.get('email')
    conn = get_db_connection()
    cursor = conn.cursor()
    if email:
        cursor.execute('SELECT id FROM members WHERE name = ? OR email = ?', (email, email))
        member = cursor.fetchone()
        member_id = member['id'] if member else None
        cursor.execute('''
            SELECT DISTINCT b.* FROM boards b
            LEFT JOIN board_members bm ON b.id = bm.board_id
            WHERE b.is_public = 1 OR b.owner_id = ? OR bm.member_id = ?
            ORDER BY b.last_activity DESC
        ''', (member_id, member_id))
        boards = [dict(row) for row in cursor.fetchall()]
    else:
        cursor.execute('SELECT * FROM boards WHERE is_public = 1 ORDER BY last_activity DESC')
        boards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(boards)

@app.route('/api/boards', methods=['POST'])
def create_board():
    data = request.get_json()
    board_id = generate_id()
    owner_email = data.get('owner_email')
    owner_id = None
    if owner_email:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM members WHERE name = ? OR email = ?', (owner_email, owner_email))
        member = cursor.fetchone()
        if member:
            owner_id = member['id']
        conn.close()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO boards (id, title, description, icon, last_activity, owner_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (board_id, data['title'], data.get('description'), 
          data.get('icon'), datetime.now().isoformat(), owner_id))
    # Thêm owner vào board_members
    if owner_id:
        cursor.execute('''
            INSERT INTO board_members (board_id, member_id)
            VALUES (?, ?)
        ''', (board_id, owner_id))
    conn.commit()
    conn.close()
    return jsonify({'id': board_id, 'message': 'Board created successfully'}), 201

@app.route('/api/boards/<board_id>', methods=['GET'])
def get_board(board_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get board info
    cursor.execute('SELECT * FROM boards WHERE id = ?', (board_id,))
    board = cursor.fetchone()
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    board_data = dict(board)
    
    # Get lists with cards
    cursor.execute('SELECT * FROM lists WHERE board_id = ? ORDER BY position', (board_id,))
    lists = []
    for list_row in cursor.fetchall():
        list_data = dict(list_row)
        
        # Get cards for this list
        cursor.execute('SELECT * FROM cards WHERE list_id = ? ORDER BY position', (list_data['id'],))
        cards = []
        for card_row in cursor.fetchall():
            card_data = dict(card_row)
            if card_data.get('checklist_items'):
                card_data['checklist_items'] = json.loads(card_data['checklist_items'])
            else:
                card_data['checklist_items'] = []
            
            # Get labels for this card
            cursor.execute('''
                SELECT l.* FROM labels l
                JOIN card_labels cl ON l.id = cl.label_id
                WHERE cl.card_id = ?
            ''', (card_data['id'],))
            card_data['labels'] = [dict(label) for label in cursor.fetchall()]
            cards.append(card_data)
        
        list_data['cards'] = cards
        lists.append(list_data)
    
    board_data['lists'] = lists
    
    # Get board labels
    cursor.execute('SELECT * FROM labels WHERE board_id = ?', (board_id,))
    board_data['labels'] = [dict(row) for row in cursor.fetchall()]
    
    # Get board members
    cursor.execute('''
        SELECT m.* FROM members m
        JOIN board_members bm ON m.id = bm.member_id
        WHERE bm.board_id = ?
    ''', (board_id,))
    board_data['members'] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(board_data)

@app.route('/api/boards/<board_id>', methods=['PUT'])
def update_board(board_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE boards 
        SET title = ?, description = ?, icon = ?, last_activity = ?
        WHERE id = ?
    ''', (data['title'], data.get('description'), data.get('icon'),
          datetime.now().isoformat(), board_id))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Board updated successfully'})

@app.route('/api/boards/<board_id>', methods=['DELETE'])
def delete_board(board_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM boards WHERE id = ?', (board_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Board deleted successfully'})

# List API endpoints
@app.route('/api/boards/<board_id>/lists', methods=['POST'])
def create_list(board_id):
    data = request.get_json()
    list_id = generate_id()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO lists (id, board_id, title, position)
        VALUES (?, ?, ?, ?)
    ''', (list_id, board_id, data['title'], data.get('position', 0)))
    conn.commit()
    conn.close()
    
    update_board_activity(board_id)
    return jsonify({'id': list_id, 'message': 'List created successfully'}), 201

@app.route('/api/lists/<list_id>', methods=['PUT'])
def update_list(list_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get board_id for activity update
    cursor.execute('SELECT board_id FROM lists WHERE id = ?', (list_id,))
    board_id = cursor.fetchone()[0]
    
    cursor.execute('''
        UPDATE lists 
        SET title = ?, position = ?
        WHERE id = ?
    ''', (data['title'], data.get('position', 0), list_id))
    
    conn.commit()
    conn.close()
    
    update_board_activity(board_id)
    return jsonify({'message': 'List updated successfully'})

@app.route('/api/lists/<list_id>', methods=['DELETE'])
def delete_list(list_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get board_id for activity update
    cursor.execute('SELECT board_id FROM lists WHERE id = ?', (list_id,))
    result = cursor.fetchone()
    if result:
        board_id = result[0]
        cursor.execute('DELETE FROM lists WHERE id = ?', (list_id,))
        conn.commit()
        conn.close()
        update_board_activity(board_id)
        return jsonify({'message': 'List deleted successfully'})
    
    conn.close()
    return jsonify({'error': 'List not found'}), 404

# Card API endpoints
@app.route('/api/lists/<list_id>/cards', methods=['POST'])
def create_card(list_id):
    data = request.get_json()
    card_id = generate_id()
    conn = get_db_connection()
    cursor = conn.cursor()
    # Get board_id
    cursor.execute('SELECT board_id FROM lists WHERE id = ?', (list_id,))
    board_id = cursor.fetchone()[0]
    cursor.execute('''
        INSERT INTO cards (id, board_id, list_id, title, description, position, due_date, type, checklist_items, start_date, end_date, member)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        card_id,
        board_id,
        list_id,
        data['title'],
        data.get('description'),
        data.get('position', 0),
        data.get('due_date'),
        data.get('type', 'normal'),
        json.dumps(data.get('checklist_items', [])),
        data.get('start_date'),
        data.get('end_date'),
        data.get('member')
    ))
    conn.commit()
    conn.close()
    update_board_activity(board_id)
    return jsonify({'id': card_id, 'message': 'Card created successfully'}), 201

@app.route('/api/cards/<card_id>', methods=['OPTIONS'])
def options_card(card_id):
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response, 200

@app.route('/api/cards/<card_id>', methods=['PUT'])
def update_card(card_id):
    data = request.get_json()
    list_id = data.get('list_id') or data.get('listId')
    if not list_id:
        return make_response(jsonify({'error': 'list_id is required'}), 400)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT board_id FROM cards WHERE id = ?', (card_id,))
    board_id_row = cursor.fetchone()
    if not board_id_row:
        conn.close()
        return make_response(jsonify({'error': 'Card not found'}), 404)
    board_id = board_id_row[0]
    cursor.execute('''
        UPDATE cards 
        SET title = ?, description = ?, position = ?, due_date = ?, list_id = ?, type = ?, checklist_items = ?, start_date = ?, end_date = ?, member = ?
        WHERE id = ?
    ''', (
        data['title'],
        data.get('description'),
        data.get('position', 0),
        data.get('due_date'),
        list_id,
        data.get('type', 'normal'),
        json.dumps(data.get('checklist_items', [])),
        data.get('start_date'),
        data.get('end_date'),
        data.get('member'),
        card_id
    ))
    conn.commit()
    conn.close()
    update_board_activity(board_id)
    response = make_response(jsonify({'message': 'Card updated successfully'}))
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/api/cards/<card_id>', methods=['DELETE'])
def delete_card(card_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get board_id for activity update
    cursor.execute('SELECT board_id FROM cards WHERE id = ?', (card_id,))
    result = cursor.fetchone()
    if result:
        board_id = result[0]
        cursor.execute('DELETE FROM cards WHERE id = ?', (card_id,))
        conn.commit()
        conn.close()
        update_board_activity(board_id)
        return jsonify({'message': 'Card deleted successfully'})
    
    conn.close()
    return jsonify({'error': 'Card not found'}), 404

# Label API endpoints
@app.route('/api/boards/<board_id>/labels', methods=['POST'])
def create_label(board_id):
    data = request.get_json()
    label_id = generate_id()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO labels (id, board_id, title, color)
        VALUES (?, ?, ?, ?)
    ''', (label_id, board_id, data['title'], data.get('color', '#808080')))
    conn.commit()
    conn.close()
    
    update_board_activity(board_id)
    return jsonify({'id': label_id, 'message': 'Label created successfully'}), 201

@app.route('/api/cards/<card_id>/labels/<label_id>', methods=['POST'])
def add_label_to_card(card_id, label_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO card_labels (card_id, label_id)
            VALUES (?, ?)
        ''', (card_id, label_id))
        conn.commit()
        
        # Update board activity
        cursor.execute('SELECT board_id FROM cards WHERE id = ?', (card_id,))
        board_id = cursor.fetchone()[0]
        update_board_activity(board_id)
        
        conn.close()
        return jsonify({'message': 'Label added to card successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Label already exists on card'}), 400

@app.route('/api/cards/<card_id>/labels/<label_id>', methods=['DELETE'])
def remove_label_from_card(card_id, label_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?', 
                   (card_id, label_id))
    conn.commit()
    
    # Update board activity
    cursor.execute('SELECT board_id FROM cards WHERE id = ?', (card_id,))
    board_id = cursor.fetchone()[0]
    update_board_activity(board_id)
    
    conn.close()
    return jsonify({'message': 'Label removed from card successfully'})

# Member API endpoints
@app.route('/api/members', methods=['POST'])
def create_member():
    data = request.get_json()
    member_id = generate_id()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO members (id, name, email, avatar)
        VALUES (?, ?, ?, ?)
    ''', (member_id, data['name'], data.get('email'), data.get('avatar')))
    conn.commit()
    conn.close()
    
    return jsonify({'id': member_id, 'message': 'Member created successfully'}), 201

@app.route('/api/boards/<board_id>/members/<member_id>', methods=['POST'])
def add_member_to_board(board_id, member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO board_members (board_id, member_id)
            VALUES (?, ?)
        ''', (board_id, member_id))
        conn.commit()
        conn.close()
        
        update_board_activity(board_id)
        return jsonify({'message': 'Member added to board successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Member already exists on board'}), 400

@app.route('/api/boards/<board_id>/members/<member_id>', methods=['DELETE'])
def remove_member_from_board(board_id, member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM board_members WHERE board_id = ? AND member_id = ?', 
                   (board_id, member_id))
    conn.commit()
    conn.close()
    
    update_board_activity(board_id)
    return jsonify({'message': 'Member removed from board successfully'})

@app.route('/api/members/by-email')
def get_member_by_email():
    email = request.args.get('email')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM members WHERE email = ?', (email,))
    member = cursor.fetchone()
    conn.close()
    if member:
        return jsonify(dict(member))
    else:
        return jsonify({'error': 'Member not found'}), 404

@app.route('/api/members', methods=['GET'])
def get_all_members():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM members')
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(members)

# Initialize database and run app
if __name__ == '__main__':
    init_database()
    app.run(debug=True, host='0.0.0.0', port=5000)