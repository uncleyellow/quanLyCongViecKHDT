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
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            company_id TEXT,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            last_activity TEXT,
            owner_id TEXT,
            is_public INTEGER DEFAULT 0,
            company_id TEXT,
            department_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES members(id) ON DELETE SET NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            avatar TEXT,
            company_id TEXT,
            department_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS board_members (
            board_id TEXT,
            member_id TEXT,
            role TEXT DEFAULT 'member',
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
            dependencies TEXT,
            status TEXT DEFAULT 'todo',
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
    
    # Thêm 3 tài khoản mẫu: công ty, phòng ban, cá nhân
    cursor.execute('SELECT id FROM members WHERE email = ?', ('company@example.com',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO members (id, name, email, avatar)
            VALUES (?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'Công ty ABC', 'company@example.com', 'assets/images/avatars/company.png'))
    cursor.execute('SELECT id FROM members WHERE email = ?', ('department@example.com',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO members (id, name, email, avatar)
            VALUES (?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'Phòng Kỹ thuật', 'department@example.com', 'assets/images/avatars/department.png'))
    cursor.execute('SELECT id FROM members WHERE email = ?', ('user@example.com',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO members (id, name, email, avatar)
            VALUES (?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'Nguyễn Văn A', 'user@example.com', 'assets/images/avatars/male-01.jpg'))
    
    # Tạo công ty và phòng ban mẫu nếu chưa có
    cursor.execute('SELECT id FROM companies WHERE name = ?', ('Công ty ABC',))
    company = cursor.fetchone()
    if not company:
        company_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO companies (id, name, description)
            VALUES (?, ?, ?)
        ''', (company_id, 'Công ty ABC', 'Công ty mẫu cho hệ thống'))
    else:
        company_id = company['id']
    cursor.execute('SELECT id FROM departments WHERE name = ?', ('Phòng Kỹ thuật',))
    department = cursor.fetchone()
    if not department:
        department_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO departments (id, name, company_id, description)
            VALUES (?, ?, ?, ?)
        ''', (department_id, 'Phòng Kỹ thuật', company_id, 'Phòng ban mẫu cho hệ thống'))
    else:
        department_id = department['id']
    # Gán các tài khoản mẫu vào công ty/phòng ban mẫu
    cursor.execute('UPDATE members SET company_id = ?, department_id = ? WHERE email = ?', (company_id, None, 'company@example.com'))
    cursor.execute('UPDATE members SET company_id = ?, department_id = ? WHERE email = ?', (company_id, department_id, 'department@example.com'))
    cursor.execute('UPDATE members SET company_id = ?, department_id = ? WHERE email = ?', (company_id, department_id, 'user@example.com'))
    
    # Thêm bảng daily_tasks
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            frequency TEXT DEFAULT 'daily',
            start_date TEXT,
            end_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_task_instances (
            id TEXT PRIMARY KEY,
            daily_task_id TEXT NOT NULL,
            task_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def migrate_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Thêm trường archived cho lists nếu chưa có
    cursor.execute("PRAGMA table_info(lists)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'archived' not in columns:
        cursor.execute('ALTER TABLE lists ADD COLUMN archived INTEGER DEFAULT 0')
    # Thêm trường archived cho cards nếu chưa có
    cursor.execute("PRAGMA table_info(cards)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'archived' not in columns:
        cursor.execute('ALTER TABLE cards ADD COLUMN archived INTEGER DEFAULT 0')
    if 'dependencies' not in columns:
        cursor.execute('ALTER TABLE cards ADD COLUMN dependencies TEXT')
    # Thêm trường company_id, department_id cho boards nếu chưa có
    cursor.execute("PRAGMA table_info(boards)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'company_id' not in columns:
        cursor.execute('ALTER TABLE boards ADD COLUMN company_id TEXT')
    if 'department_id' not in columns:
        cursor.execute('ALTER TABLE boards ADD COLUMN department_id TEXT')
    # Thêm trường company_id, department_id cho members nếu chưa có
    cursor.execute("PRAGMA table_info(members)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'company_id' not in columns:
        cursor.execute('ALTER TABLE members ADD COLUMN company_id TEXT')
    if 'department_id' not in columns:
        cursor.execute('ALTER TABLE members ADD COLUMN department_id TEXT')
    # Thêm trường role cho board_members nếu chưa có
    cursor.execute("PRAGMA table_info(board_members)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'role' not in columns:
        cursor.execute('ALTER TABLE board_members ADD COLUMN role TEXT DEFAULT "member"')
    # Thêm trường status cho cards nếu chưa có
    cursor.execute("PRAGMA table_info(cards)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'status' not in columns:
        cursor.execute('ALTER TABLE cards ADD COLUMN status TEXT DEFAULT "todo"')
    
    # Thêm bảng widgets nếu chưa có
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'")
    if not cursor.fetchone():
        cursor.execute('''
            CREATE TABLE widgets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                config TEXT,
                position INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE
            )
        ''')
    
    # Thêm bảng daily_tasks sau bảng widgets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            frequency TEXT DEFAULT 'daily',
            start_date TEXT,
            end_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_task_instances (
            id TEXT PRIMARY KEY,
            daily_task_id TEXT NOT NULL,
            task_date TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
        )
    ''')
    
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
    if not data or not data.get('title'):
        return jsonify({'error': 'Board title is required'}), 400
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

# Thêm decorator kiểm tra quyền quản lý board
def require_board_admin(func):
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        board_id = kwargs.get('board_id')
        user_email = request.args.get('user_email')
        if not user_email or not board_id:
            return jsonify({'error': 'Missing user_email or board_id'}), 403
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT bm.role, b.owner_id, m.id as member_id
            FROM board_members bm
            JOIN members m ON bm.member_id = m.id
            JOIN boards b ON bm.board_id = b.id
            WHERE bm.board_id = ? AND m.email = ?
        ''', (board_id, user_email))
        result = cursor.fetchone()
        conn.close()
        if not result or (result['role'] != 'admin' and result['owner_id'] != result['member_id']):
            return jsonify({'error': 'Permission denied. Admin access required.'}), 403
        return func(*args, **kwargs)
    return wrapper

# Thêm decorator kiểm tra quyền member board
def require_board_member(func):
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        board_id = kwargs.get('board_id')
        user_email = request.args.get('user_email')
        if not user_email or not board_id:
            return jsonify({'error': 'Missing user_email or board_id'}), 403
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT bm.role, b.owner_id, m.id as member_id
            FROM board_members bm
            JOIN members m ON bm.member_id = m.id
            JOIN boards b ON bm.board_id = b.id
            WHERE bm.board_id = ? AND m.email = ?
        ''', (board_id, user_email))
        result = cursor.fetchone()
        conn.close()
        if not result:
            return jsonify({'error': 'Permission denied. Board member access required.'}), 403
        return func(*args, **kwargs)
    return wrapper

# API thêm member vào board với role
@app.route('/api/boards/<board_id>/members/<member_id>', methods=['POST'])
@require_board_admin
def add_member_to_board(board_id, member_id):
    data = request.get_json()
    role = data.get('role', 'member') if data else 'member'
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO board_members (board_id, member_id, role)
            VALUES (?, ?, ?)
        ''', (board_id, member_id, role))
        conn.commit()
        conn.close()
        
        update_board_activity(board_id)
        return jsonify({'message': 'Member added to board successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Member already exists on board'}), 400

# API cập nhật role của member trong board
@app.route('/api/boards/<board_id>/members/<member_id>/role', methods=['PUT'])
@require_board_admin
def update_member_role(board_id, member_id):
    data = request.get_json()
    role = data.get('role')
    if not role:
        return jsonify({'error': 'Role is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE board_members SET role = ? WHERE board_id = ? AND member_id = ?
    ''', (role, board_id, member_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Member role updated successfully'})

# API lấy danh sách member của board với role
@app.route('/api/boards/<board_id>/members', methods=['GET'])
@require_board_member
def get_board_members(board_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT m.*, bm.role, bm.joined_at
        FROM members m
        JOIN board_members bm ON m.id = bm.member_id
        WHERE bm.board_id = ?
    ''', (board_id,))
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(members)

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
    # Get lists with cards (chỉ lấy list chưa archived)
    cursor.execute('SELECT * FROM lists WHERE board_id = ? AND (archived IS NULL OR archived = 0) ORDER BY position', (board_id,))
    lists = []
    for list_row in cursor.fetchall():
        list_data = dict(list_row)
        # Get cards for this list (chỉ lấy card chưa archived)
        cursor.execute('SELECT * FROM cards WHERE list_id = ? AND (archived IS NULL OR archived = 0) ORDER BY position', (list_data['id'],))
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
    # Get board members with role
    cursor.execute('''
        SELECT m.*, bm.role, bm.joined_at FROM members m
        JOIN board_members bm ON m.id = bm.member_id
        WHERE bm.board_id = ?
    ''', (board_id,))
    board_data['members'] = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(board_data)

@app.route('/api/boards/<board_id>', methods=['PUT'])
def update_board(board_id):
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Board title is required'}), 400
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
    if not data or not data.get('title'):
        return jsonify({'error': 'List title is required'}), 400
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
    if not data or not data.get('title'):
        return jsonify({'error': 'List title is required'}), 400
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

@app.route('/api/lists/<list_id>/archive', methods=['PUT'])
def archive_list(list_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE lists SET archived = 1 WHERE id = ?', (list_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'List archived successfully'})

@app.route('/api/lists/<list_id>/restore', methods=['PUT'])
def restore_list(list_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE lists SET archived = 0 WHERE id = ?', (list_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'List restored successfully'})

# Card API endpoints
@app.route('/api/lists/<list_id>/cards', methods=['POST'])
def create_card(list_id):
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Card title is required'}), 400
    card_id = generate_id()
    conn = get_db_connection()
    cursor = conn.cursor()
    # Get board_id
    cursor.execute('SELECT board_id FROM lists WHERE id = ?', (list_id,))
    board_id = cursor.fetchone()[0]
    cursor.execute('''
        INSERT INTO cards (id, board_id, list_id, title, description, position, due_date, type, checklist_items, start_date, end_date, dependencies, status, member)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.get('dependencies'),
        data.get('status', 'todo'),
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
    if not data or not data.get('title'):
        return make_response(jsonify({'error': 'Card title is required'}), 400)
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
        SET title = ?, description = ?, position = ?, due_date = ?, list_id = ?, type = ?, checklist_items = ?, start_date = ?, end_date = ?, dependencies = ?, status = ?, member = ?
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
        data.get('dependencies'),
        data.get('status', 'todo'),
        data.get('member'),
        card_id
    ))
    # --- XỬ LÝ LABELS ---
    labels = data.get('labels')
    if labels is not None:
        # Xóa hết nhãn cũ
        cursor.execute('DELETE FROM card_labels WHERE card_id = ?', (card_id,))
        # Thêm lại nhãn mới
        for label_id in labels:
            cursor.execute('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', (card_id, label_id))
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

@app.route('/api/cards/<card_id>/archive', methods=['PUT'])
def archive_card(card_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE cards SET archived = 1 WHERE id = ?', (card_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Card archived successfully'})

@app.route('/api/cards/<card_id>/restore', methods=['PUT'])
def restore_card(card_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE cards SET archived = 0 WHERE id = ?', (card_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Card restored successfully'})

@app.route('/api/cards/<card_id>/copy', methods=['POST'])
def copy_card(card_id):
    data = request.get_json()
    dest_list_id = data.get('list_id')
    dest_board_id = data.get('board_id')
    if not dest_list_id or not dest_board_id:
        return jsonify({'error': 'list_id and board_id are required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
    card = cursor.fetchone()
    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    new_card_id = generate_id()
    cursor.execute('''
        INSERT INTO cards (id, board_id, list_id, title, description, position, due_date, type, checklist_items, start_date, end_date, member, created_at, archived)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        new_card_id,
        dest_board_id,
        dest_list_id,
        card['title'],
        card['description'],
        card['position'],
        card['due_date'],
        card['type'],
        card['checklist_items'],
        card['start_date'],
        card['end_date'],
        card['member'],
        datetime.now().isoformat(),
        0
    ))
    # Copy labels
    cursor.execute('SELECT label_id FROM card_labels WHERE card_id = ?', (card_id,))
    for row in cursor.fetchall():
        cursor.execute('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', (new_card_id, row['label_id']))
    conn.commit()
    conn.close()
    return jsonify({'id': new_card_id, 'message': 'Card copied successfully'})

@app.route('/api/cards/<card_id>/move', methods=['PUT'])
def move_card(card_id):
    data = request.get_json()
    dest_list_id = data.get('list_id')
    dest_board_id = data.get('board_id')
    if not dest_list_id or not dest_board_id:
        return jsonify({'error': 'list_id and board_id are required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
    card = cursor.fetchone()
    if not card:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    cursor.execute('''
        UPDATE cards SET list_id = ?, board_id = ? WHERE id = ?
    ''', (dest_list_id, dest_board_id, card_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Card moved successfully'})

# Label API endpoints
@app.route('/api/boards/<board_id>/labels', methods=['POST'])
def create_label(board_id):
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Label title is required'}), 400
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
    if not data or not data.get('name'):
        return jsonify({'error': 'Member name is required'}), 400
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

@app.route('/api/boards/<board_id>/lists/reorder', methods=['PUT'])
def reorder_lists(board_id):
    data = request.get_json()
    list_ids = data.get('list_ids')
    if not isinstance(list_ids, list):
        return jsonify({'error': 'list_ids must be a list'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    for position, list_id in enumerate(list_ids):
        cursor.execute('UPDATE lists SET position = ? WHERE id = ? AND board_id = ?', (position, list_id, board_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Lists reordered successfully'})

@app.route('/api/lists/<list_id>/cards/reorder', methods=['PUT'])
def reorder_cards(list_id):
    data = request.get_json()
    card_ids = data.get('card_ids')
    if not isinstance(card_ids, list):
        return jsonify({'error': 'card_ids must be a list'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    for position, card_id in enumerate(card_ids):
        cursor.execute('UPDATE cards SET position = ?, list_id = ? WHERE id = ?', (position, list_id, card_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Cards reordered successfully'})

@app.route('/api/cards/<card_id>/checklist', methods=['POST'])
def add_checklist_item(card_id):
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({'error': 'Checklist item text is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT checklist_items FROM cards WHERE id = ?', (card_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    checklist_items = json.loads(row['checklist_items']) if row['checklist_items'] else []
    item_id = generate_id()
    checklist_items.append({'id': item_id, 'text': text, 'checked': False})
    cursor.execute('UPDATE cards SET checklist_items = ? WHERE id = ?', (json.dumps(checklist_items), card_id))
    conn.commit()
    conn.close()
    return jsonify({'id': item_id, 'message': 'Checklist item added'})

@app.route('/api/cards/<card_id>/checklist/<item_id>', methods=['PUT'])
def update_checklist_item(card_id, item_id):
    data = request.get_json()
    text = data.get('text')
    checked = data.get('checked')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT checklist_items FROM cards WHERE id = ?', (card_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    checklist_items = json.loads(row['checklist_items']) if row['checklist_items'] else []
    updated = False
    for item in checklist_items:
        if item['id'] == item_id:
            if text is not None:
                item['text'] = text
            if checked is not None:
                item['checked'] = checked
            updated = True
            break
    if not updated:
        conn.close()
        return jsonify({'error': 'Checklist item not found'}), 404
    cursor.execute('UPDATE cards SET checklist_items = ? WHERE id = ?', (json.dumps(checklist_items), card_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Checklist item updated'})

@app.route('/api/cards/<card_id>/checklist/<item_id>', methods=['DELETE'])
def delete_checklist_item(card_id, item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT checklist_items FROM cards WHERE id = ?', (card_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Card not found'}), 404
    checklist_items = json.loads(row['checklist_items']) if row['checklist_items'] else []
    new_items = [item for item in checklist_items if item['id'] != item_id]
    if len(new_items) == len(checklist_items):
        conn.close()
        return jsonify({'error': 'Checklist item not found'}), 404
    cursor.execute('UPDATE cards SET checklist_items = ? WHERE id = ?', (json.dumps(new_items), card_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Checklist item deleted'})

@app.route('/api/boards/<board_id>/gantt', methods=['GET'])
def get_gantt_data(board_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Lấy tất cả các card của board (bao gồm cả archived nếu muốn, hoặc chỉ chưa archived)
    cursor.execute('''
        SELECT id, title, start_date, end_date, dependencies, position, list_id, description, due_date, type, member
        FROM cards
        WHERE board_id = ?
    ''', (board_id,))
    cards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(cards)

@app.route('/api/companies', methods=['GET'])
def get_companies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM companies')
    companies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(companies)

@app.route('/api/companies', methods=['POST'])
def create_company():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Company name is required'}), 400
    company_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO companies (id, name, description)
        VALUES (?, ?, ?)
    ''', (company_id, data['name'], data.get('description')))
    conn.commit()
    conn.close()
    return jsonify({'id': company_id, 'message': 'Company created successfully'}), 201

@app.route('/api/companies/<company_id>', methods=['PUT'])
def update_company(company_id):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Company name is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE companies SET name = ?, description = ? WHERE id = ?
    ''', (data['name'], data.get('description'), company_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Company updated successfully'})

@app.route('/api/companies/<company_id>', methods=['DELETE'])
def delete_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM companies WHERE id = ?', (company_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Company deleted successfully'})

@app.route('/api/departments', methods=['GET'])
def get_departments():
    company_id = request.args.get('company_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    if company_id:
        cursor.execute('SELECT * FROM departments WHERE company_id = ?', (company_id,))
    else:
        cursor.execute('SELECT * FROM departments')
    departments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(departments)

@app.route('/api/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Department name is required'}), 400
    department_id = str(uuid.uuid4())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO departments (id, name, company_id, description)
        VALUES (?, ?, ?, ?)
    ''', (department_id, data['name'], data.get('company_id'), data.get('description')))
    conn.commit()
    conn.close()
    return jsonify({'id': department_id, 'message': 'Department created successfully'}), 201

@app.route('/api/departments/<department_id>', methods=['PUT'])
def update_department(department_id):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Department name is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE departments SET name = ?, company_id = ?, description = ? WHERE id = ?
    ''', (data['name'], data.get('company_id'), data.get('description'), department_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Department updated successfully'})

@app.route('/api/departments/<department_id>', methods=['DELETE'])
def delete_department(department_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM departments WHERE id = ?', (department_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Department deleted successfully'})

def require_company_member(func):
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        company_id = kwargs.get('company_id') or request.args.get('company_id')
        user_email = request.args.get('user_email')
        if not user_email or not company_id:
            return jsonify({'error': 'Missing user_email or company_id'}), 403
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM members WHERE email = ?', (user_email,))
        member = cursor.fetchone()
        conn.close()
        if not member or str(member['company_id']) != str(company_id):
            return jsonify({'error': 'Permission denied'}), 403
        return func(*args, **kwargs)
    return wrapper

def require_department_member(func):
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        department_id = kwargs.get('department_id') or request.args.get('department_id')
        user_email = request.args.get('user_email')
        if not user_email or not department_id:
            return jsonify({'error': 'Missing user_email or department_id'}), 403
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM members WHERE email = ?', (user_email,))
        member = cursor.fetchone()
        conn.close()
        if not member or str(member['department_id']) != str(department_id):
            return jsonify({'error': 'Permission denied'}), 403
        return func(*args, **kwargs)
    return wrapper

@app.route('/api/boards/by-company/<company_id>', methods=['GET'])
@require_company_member
def get_boards_by_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM boards WHERE company_id = ?', (company_id,))
    boards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(boards)

@app.route('/api/boards/by-department/<department_id>', methods=['GET'])
@require_department_member
def get_boards_by_department(department_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM boards WHERE department_id = ?', (department_id,))
    boards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(boards)

@app.route('/api/members/by-company/<company_id>', methods=['GET'])
@require_company_member
def get_members_by_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM members WHERE company_id = ?', (company_id,))
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(members)

@app.route('/api/members/by-department/<department_id>', methods=['GET'])
@require_department_member
def get_members_by_department(department_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM members WHERE department_id = ?', (department_id,))
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(members)

# Widget API endpoints
@app.route('/api/widgets', methods=['GET'])
def get_widgets():
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    cursor.execute('''
        SELECT * FROM widgets 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY position
    ''', (user['id'],))
    widgets = [dict(row) for row in cursor.fetchall()]
    
    # Parse config JSON
    for widget in widgets:
        if widget.get('config'):
            try:
                widget['config'] = json.loads(widget['config'])
            except:
                widget['config'] = {}
        else:
            widget['config'] = {}
    
    conn.close()
    return jsonify(widgets)

@app.route('/api/widgets', methods=['POST'])
def create_widget():
    data = request.get_json()
    user_email = data.get('user_email')
    widget_type = data.get('type')
    title = data.get('title')
    config = data.get('config', {})
    
    if not user_email or not widget_type or not title:
        return jsonify({'error': 'user_email, type, and title are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    widget_id = generate_id()
    cursor.execute('''
        INSERT INTO widgets (id, user_id, type, title, config, position)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (widget_id, user['id'], widget_type, title, json.dumps(config), data.get('position', 0)))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': widget_id, 
        'message': 'Widget created successfully',
        'widget': {
            'id': widget_id,
            'user_id': user['id'],
            'type': widget_type,
            'title': title,
            'config': config,
            'position': data.get('position', 0)
        }
    }), 201

@app.route('/api/widgets/<widget_id>', methods=['PUT'])
def update_widget(widget_id):
    data = request.get_json()
    user_email = data.get('user_email')
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu widget
    cursor.execute('''
        SELECT w.* FROM widgets w
        JOIN members m ON w.user_id = m.id
        WHERE w.id = ? AND m.email = ?
    ''', (widget_id, user_email))
    widget = cursor.fetchone()
    
    if not widget:
        conn.close()
        return jsonify({'error': 'Widget not found or access denied'}), 404
    
    # Cập nhật widget
    update_fields = []
    params = []
    
    if 'title' in data:
        update_fields.append('title = ?')
        params.append(data['title'])
    
    if 'type' in data:
        update_fields.append('type = ?')
        params.append(data['type'])
    
    if 'config' in data:
        update_fields.append('config = ?')
        params.append(json.dumps(data['config']))
    
    if 'position' in data:
        update_fields.append('position = ?')
        params.append(data['position'])
    
    if 'is_active' in data:
        update_fields.append('is_active = ?')
        params.append(data['is_active'])
    
    if update_fields:
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(widget_id)
        
        cursor.execute(f'''
            UPDATE widgets 
            SET {', '.join(update_fields)}
            WHERE id = ?
        ''', params)
        
        conn.commit()
    
    conn.close()
    return jsonify({'message': 'Widget updated successfully'})

@app.route('/api/widgets/<widget_id>', methods=['DELETE'])
def delete_widget(widget_id):
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu widget
    cursor.execute('''
        SELECT w.* FROM widgets w
        JOIN members m ON w.user_id = m.id
        WHERE w.id = ? AND m.email = ?
    ''', (widget_id, user_email))
    widget = cursor.fetchone()
    
    if not widget:
        conn.close()
        return jsonify({'error': 'Widget not found or access denied'}), 404
    
    cursor.execute('DELETE FROM widgets WHERE id = ?', (widget_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Widget deleted successfully'})

@app.route('/api/widgets/reorder', methods=['PUT'])
def reorder_widgets():
    data = request.get_json()
    user_email = data.get('user_email')
    widget_positions = data.get('widget_positions')  # [{id: "widget_id", position: 0}, ...]
    
    if not user_email or not widget_positions:
        return jsonify({'error': 'user_email and widget_positions are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra user
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Cập nhật vị trí các widget
    for item in widget_positions:
        widget_id = item.get('id')
        position = item.get('position', 0)
        
        if widget_id:
            cursor.execute('''
                UPDATE widgets 
                SET position = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
            ''', (position, datetime.now().isoformat(), widget_id, user['id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Widgets reordered successfully'})

# API lấy dữ liệu cho các loại widget
@app.route('/api/widgets/data/<widget_type>', methods=['GET'])
def get_widget_data(widget_type):
    user_email = request.args.get('user_email')
    board_id = request.args.get('board_id')
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra user
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    data = {}
    
    if widget_type == 'status_chart':
        # Dữ liệu cho biểu đồ trạng thái task
        if board_id:
            cursor.execute('''
                SELECT status, COUNT(*) as count
                FROM cards 
                WHERE board_id = ? AND (archived IS NULL OR archived = 0)
                GROUP BY status
            ''', (board_id,))
        else:
            # Lấy tất cả board của user
            cursor.execute('''
                SELECT status, COUNT(*) as count
                FROM cards c
                JOIN board_members bm ON c.board_id = bm.board_id
                WHERE bm.member_id = ? AND (c.archived IS NULL OR c.archived = 0)
                GROUP BY status
            ''', (user['id'],))
        
        status_data = {row['status']: row['count'] for row in cursor.fetchall()}
        data = {
            'labels': ['Todo', 'In Progress', 'Done'],
            'datasets': [{
                'label': 'Tasks',
                'data': [
                    status_data.get('todo', 0),
                    status_data.get('in_progress', 0),
                    status_data.get('done', 0)
                ],
                'backgroundColor': ['#ff9800', '#2196f3', '#4caf50']
            }]
        }
    
    elif widget_type == 'recent_activities':
        # Dữ liệu cho hoạt động gần đây
        if board_id:
            cursor.execute('''
                SELECT c.title, c.status, c.updated_at, l.title as list_title
                FROM cards c
                JOIN lists l ON c.list_id = l.id
                WHERE c.board_id = ? AND (c.archived IS NULL OR c.archived = 0)
                ORDER BY c.updated_at DESC
                LIMIT 10
            ''', (board_id,))
        else:
            cursor.execute('''
                SELECT c.title, c.status, c.updated_at, l.title as list_title, b.title as board_title
                FROM cards c
                JOIN lists l ON c.list_id = l.id
                JOIN board_members bm ON c.board_id = bm.board_id
                JOIN boards b ON c.board_id = b.id
                WHERE bm.member_id = ? AND (c.archived IS NULL OR c.archived = 0)
                ORDER BY c.updated_at DESC
                LIMIT 10
            ''', (user['id'],))
        
        activities = [dict(row) for row in cursor.fetchall()]
        data = {'activities': activities}
    
    elif widget_type == 'gantt_chart':
        # Dữ liệu cho Gantt chart
        if board_id:
            cursor.execute('''
                SELECT id, title, start_date, end_date, status, member
                FROM cards
                WHERE board_id = ? AND (archived IS NULL OR archived = 0)
                AND start_date IS NOT NULL AND end_date IS NOT NULL
                ORDER BY start_date
            ''', (board_id,))
        else:
            cursor.execute('''
                SELECT c.id, c.title, c.start_date, c.end_date, c.status, c.member, b.title as board_title
                FROM cards c
                JOIN board_members bm ON c.board_id = bm.board_id
                JOIN boards b ON c.board_id = b.id
                WHERE bm.member_id = ? AND (c.archived IS NULL OR c.archived = 0)
                AND c.start_date IS NOT NULL AND c.end_date IS NOT NULL
                ORDER BY c.start_date
            ''', (user['id'],))
        
        gantt_data = [dict(row) for row in cursor.fetchall()]
        data = {'tasks': gantt_data}
    
    conn.close()
    return jsonify(data)

# Daily Tasks API endpoints
@app.route('/api/daily-tasks', methods=['GET'])
def get_daily_tasks():
    user_email = request.args.get('user_email')
    date = request.args.get('date')  # Format: YYYY-MM-DD
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Lấy user_id
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Lấy danh sách daily tasks của user
    cursor.execute('''
        SELECT * FROM daily_tasks 
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at DESC
    ''', (user['id'],))
    daily_tasks = [dict(row) for row in cursor.fetchall()]
    
    # Nếu có date, lấy instances cho ngày đó
    if date:
        for task in daily_tasks:
            cursor.execute('''
                SELECT * FROM daily_task_instances 
                WHERE daily_task_id = ? AND task_date = ?
            ''', (task['id'], date))
            instance = cursor.fetchone()
            if instance:
                task['instance'] = dict(instance)
            else:
                task['instance'] = None
    
    conn.close()
    return jsonify(daily_tasks)

@app.route('/api/daily-tasks', methods=['POST'])
def create_daily_task():
    data = request.get_json()
    user_email = data.get('user_email')
    title = data.get('title')
    frequency = data.get('frequency', 'daily')
    
    if not user_email or not title:
        return jsonify({'error': 'user_email and title are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Lấy user_id
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    task_id = generate_id()
    cursor.execute('''
        INSERT INTO daily_tasks (id, user_id, title, description, frequency, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (task_id, user['id'], title, data.get('description'), frequency, 
          data.get('start_date'), data.get('end_date')))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': task_id, 
        'message': 'Daily task created successfully'
    }), 201

@app.route('/api/daily-tasks/<task_id>', methods=['PUT'])
def update_daily_task(task_id):
    data = request.get_json()
    user_email = data.get('user_email')
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    # Cập nhật task
    update_fields = []
    params = []
    
    if 'title' in data:
        update_fields.append('title = ?')
        params.append(data['title'])
    
    if 'description' in data:
        update_fields.append('description = ?')
        params.append(data['description'])
    
    if 'frequency' in data:
        update_fields.append('frequency = ?')
        params.append(data['frequency'])
    
    if 'start_date' in data:
        update_fields.append('start_date = ?')
        params.append(data['start_date'])
    
    if 'end_date' in data:
        update_fields.append('end_date = ?')
        params.append(data['end_date'])
    
    if 'is_active' in data:
        update_fields.append('is_active = ?')
        params.append(data['is_active'])
    
    if update_fields:
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(task_id)
        
        cursor.execute(f'''
            UPDATE daily_tasks 
            SET {', '.join(update_fields)}
            WHERE id = ?
        ''', params)
        
        conn.commit()
    
    conn.close()
    return jsonify({'message': 'Daily task updated successfully'})

@app.route('/api/daily-tasks/<task_id>', methods=['DELETE'])
def delete_daily_task(task_id):
    user_email = request.args.get('user_email')
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    cursor.execute('DELETE FROM daily_tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Daily task deleted successfully'})

@app.route('/api/daily-tasks/<task_id>/start', methods=['POST'])
def start_daily_task(task_id):
    data = request.get_json()
    user_email = data.get('user_email')
    date = data.get('date')  # Format: YYYY-MM-DD
    
    if not user_email or not date:
        return jsonify({'error': 'user_email and date are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    # Kiểm tra instance đã tồn tại chưa
    cursor.execute('''
        SELECT * FROM daily_task_instances 
        WHERE daily_task_id = ? AND task_date = ?
    ''', (task_id, date))
    instance = cursor.fetchone()
    
    if instance:
        # Cập nhật instance hiện tại
        cursor.execute('''
            UPDATE daily_task_instances 
            SET status = ?, started_at = ?
            WHERE id = ?
        ''', ('in_progress', datetime.now().isoformat(), instance['id']))
    else:
        # Tạo instance mới
        instance_id = generate_id()
        cursor.execute('''
            INSERT INTO daily_task_instances (id, daily_task_id, task_date, status, started_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (instance_id, task_id, date, 'in_progress', datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task started successfully'})

@app.route('/api/daily-tasks/<task_id>/complete', methods=['POST'])
def complete_daily_task(task_id):
    data = request.get_json()
    user_email = data.get('user_email')
    date = data.get('date')  # Format: YYYY-MM-DD
    notes = data.get('notes')
    
    if not user_email or not date:
        return jsonify({'error': 'user_email and date are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    # Kiểm tra instance
    cursor.execute('''
        SELECT * FROM daily_task_instances 
        WHERE daily_task_id = ? AND task_date = ?
    ''', (task_id, date))
    instance = cursor.fetchone()
    
    if instance:
        # Cập nhật instance
        cursor.execute('''
            UPDATE daily_task_instances 
            SET status = ?, completed_at = ?, notes = ?
            WHERE id = ?
        ''', ('completed', datetime.now().isoformat(), notes, instance['id']))
    else:
        # Tạo instance mới với trạng thái completed
        instance_id = generate_id()
        cursor.execute('''
            INSERT INTO daily_task_instances (id, daily_task_id, task_date, status, completed_at, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (instance_id, task_id, date, 'completed', datetime.now().isoformat(), notes))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task completed successfully'})

@app.route('/api/daily-tasks/<task_id>/skip', methods=['POST'])
def skip_daily_task(task_id):
    data = request.get_json()
    user_email = data.get('user_email')
    date = data.get('date')  # Format: YYYY-MM-DD
    notes = data.get('notes')
    
    if not user_email or not date:
        return jsonify({'error': 'user_email and date are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    # Kiểm tra instance
    cursor.execute('''
        SELECT * FROM daily_task_instances 
        WHERE daily_task_id = ? AND task_date = ?
    ''', (task_id, date))
    instance = cursor.fetchone()
    
    if instance:
        # Cập nhật instance
        cursor.execute('''
            UPDATE daily_task_instances 
            SET status = ?, notes = ?
            WHERE id = ?
        ''', ('skipped', notes, instance['id']))
    else:
        # Tạo instance mới với trạng thái skipped
        instance_id = generate_id()
        cursor.execute('''
            INSERT INTO daily_task_instances (id, daily_task_id, task_date, status, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (instance_id, task_id, date, 'skipped', notes))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task skipped successfully'})

@app.route('/api/daily-tasks/<task_id>/instances', methods=['GET'])
def get_daily_task_instances(task_id):
    user_email = request.args.get('user_email')
    start_date = request.args.get('start_date')  # Format: YYYY-MM-DD
    end_date = request.args.get('end_date')      # Format: YYYY-MM-DD
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kiểm tra quyền sở hữu
    cursor.execute('''
        SELECT dt.* FROM daily_tasks dt
        JOIN members m ON dt.user_id = m.id
        WHERE dt.id = ? AND m.email = ?
    ''', (task_id, user_email))
    task = cursor.fetchone()
    
    if not task:
        conn.close()
        return jsonify({'error': 'Task not found or access denied'}), 404
    
    # Lấy instances
    if start_date and end_date:
        cursor.execute('''
            SELECT * FROM daily_task_instances 
            WHERE daily_task_id = ? AND task_date BETWEEN ? AND ?
            ORDER BY task_date DESC
        ''', (task_id, start_date, end_date))
    else:
        cursor.execute('''
            SELECT * FROM daily_task_instances 
            WHERE daily_task_id = ?
            ORDER BY task_date DESC
        ''', (task_id,))
    
    instances = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(instances)

@app.route('/api/daily-tasks/summary', methods=['GET'])
def get_daily_tasks_summary():
    user_email = request.args.get('user_email')
    date = request.args.get('date')  # Format: YYYY-MM-DD
    
    if not user_email:
        return jsonify({'error': 'user_email is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Lấy user_id
    cursor.execute('SELECT id FROM members WHERE email = ?', (user_email,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    if date:
        # Lấy summary cho ngày cụ thể
        cursor.execute('''
            SELECT 
                dt.title,
                dti.status,
                dti.started_at,
                dti.completed_at,
                dti.notes
            FROM daily_tasks dt
            LEFT JOIN daily_task_instances dti ON dt.id = dti.daily_task_id AND dti.task_date = ?
            WHERE dt.user_id = ? AND dt.is_active = 1
            ORDER BY dt.created_at
        ''', (date, user['id']))
    else:
        # Lấy summary cho hôm nay
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT 
                dt.title,
                dti.status,
                dti.started_at,
                dti.completed_at,
                dti.notes
            FROM daily_tasks dt
            LEFT JOIN daily_task_instances dti ON dt.id = dti.daily_task_id AND dti.task_date = ?
            WHERE dt.user_id = ? AND dt.is_active = 1
            ORDER BY dt.created_at
        ''', (today, user['id']))
    
    tasks = [dict(row) for row in cursor.fetchall()]
    
    # Tính toán thống kê
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t['status'] == 'completed'])
    in_progress_tasks = len([t for t in tasks if t['status'] == 'in_progress'])
    pending_tasks = len([t for t in tasks if t['status'] == 'pending' or t['status'] is None])
    skipped_tasks = len([t for t in tasks if t['status'] == 'skipped'])
    
    summary = {
        'date': date or datetime.now().strftime('%Y-%m-%d'),
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'pending_tasks': pending_tasks,
        'skipped_tasks': skipped_tasks,
        'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        'tasks': tasks
    }
    
    conn.close()
    return jsonify(summary)

# Initialize database and run app
if __name__ == '__main__':
    migrate_database()
    init_database()
    app.run(debug=True, host='0.0.0.0', port=5000)