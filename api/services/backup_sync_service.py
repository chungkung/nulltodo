import sqlite3
import json
import os
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import shutil
from pathlib import Path

# 修复：导入标准加密
try:
    from cryptography.fernet import Fernet
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("Warning: cryptography library not available. Encryption will be disabled.")

DB_PATH = 'tasks.db'
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backups')


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_backup_dir():
    """确保备份目录存在"""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)
    return BACKUP_DIR


def generate_backup_filename() -> str:
    """生成备份文件名"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"task_manager_backup_{timestamp}.json"


class BackupManager:
    def __init__(self):
        self.backup_dir = ensure_backup_dir()
        
        # 如果加密密钥（如果支持
        self.cipher = None
        if CRYPTO_AVAILABLE:
            # 获取或生成密钥
            self.key_file = os.path.join(self.backup_dir, '.encryption_key')
            self._setup_encryption()
    
    def _setup_encryption(self):
        """设置加密"""
        try:
            if os.path.exists(self.key_file):
                with open(self.key_file, 'rb') as f:
                    key = f.read()
            else:
                key = Fernet.generate_key()
                with open(self.key_file, 'wb') as f:
                    f.write(key)
            
            self.cipher = Fernet(key)
        except Exception as e:
            print(f"Error setting up encryption: {e}")
            self.cipher = None
    
    def _export_all_data(self) -> Dict:
        """导出所有数据（内部方法）"""
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        
        data = {
            'exported_at': datetime.now().isoformat(),
            'version': '1.0',
            'data': {}
        }
        
        # 获取所有表
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        # 导出每个表的数据
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            data['data'][table] = [dict(row) for row in rows]
        
        conn.close()
        return data
    
    def export_all_data(self) -> Dict:
        """导出所有数据"""
        return self._export_all_data()
    
    def create_backup(self, encrypt: bool = False) -> Dict:
        """创建备份"""
        data = self._export_all_data()
        
        filename = generate_backup_filename()
        filepath = os.path.join(self.backup_dir, filename)
        
        # 写入JSON
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        
        if encrypt and self.cipher:
            encrypted = self.cipher.encrypt(json_data.encode('utf-8'))
            filepath += '.encrypted'
            with open(filepath, 'wb') as f:
                f.write(encrypted)
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(json_data)
        
        return {
            'success': True,
            'filename': filename,
            'filepath': filepath,
            'encrypted': encrypt and self.cipher is not None,
            'size_bytes': os.path.getsize(filepath)
        }
    
    def list_backups(self) -> List[Dict]:
        """列出所有备份"""
        backups = []
        
        if not os.path.exists(self.backup_dir):
            return backups
        
        for filename in os.listdir(self.backup_dir):
            if filename.startswith('task_manager_backup_'):
                filepath = os.path.join(self.backup_dir, filename)
                stat = os.stat(filepath)
                
                backups.append({
                    'filename': filename,
                    'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'size_bytes': stat.st_size,
                    'is_encrypted': filename.endswith('.encrypted')
                })
        
        backups.sort(key=lambda x: x['created_at'], reverse=True)
        return backups
    
    def _read_backup(self, filename: str) -> Optional[Dict]:
        """读取备份文件"""
        filepath = os.path.join(self.backup_dir, filename)
        
        if not os.path.exists(filepath):
            return None
        
        try:
            if filename.endswith('.encrypted') and self.cipher:
                with open(filepath, 'rb') as f:
                    encrypted_data = f.read()
                json_str = self.cipher.decrypt(encrypted_data).decode('utf-8')
            else:
                with open(filepath, 'r', encoding='utf-8') as f:
                    json_str = f.read()
            
            return json.loads(json_str)
        except Exception as e:
            print(f"Error reading backup: {e}")
            return None
    
    def _restore_data(self, data: Dict) -> bool:
        """恢复数据"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            for table, rows in data['data'].items():
                #清空表
                cursor.execute(f"DELETE FROM {table}")
                
                if not rows:
                    continue
                
                # 重建数据
                first_row = rows[0]
                columns = list(first_row.keys())
                
                placeholders = ','.join(['?' for _ in columns])
                column_str = ','.join(columns)
                
                for row in rows:
                    values = [row.get(col) for col in columns]
                    cursor.execute(
                    f"INSERT INTO {table} ({column_str}) VALUES ({placeholders})",
                    values
                )
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error restoring data: {e}")
            return False
    
    def restore_backup(self, filename: str) -> Dict:
        """恢复备份"""
        data = self._read_backup(filename)
        
        if not data:
            return {'success': False, 'error': '无法读取备份文件'}
        
        success = self._restore_data(data)
        
        return {
            'success': success,
            'filename': filename,
            'backup_date': data.get('exported_at')
        }
    
    def delete_backup(self, filename: str) -> bool:
        """删除备份"""
        filepath = os.path.join(self.backup_dir, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    
    def auto_backup(self, interval_hours: int = 24):
        """自动备份（基于间隔"""
        now = datetime.now()
        
        #检查最近备份
        last_backup = None
        backups = self.list_backups()
        
        if backups:
            last_backup_time = datetime.fromisoformat(backups[0]['created_at'])
            if (now - last_backup_time).total_seconds() < interval_hours * 3600:
                return {'success': False, 'reason': '最近已备份'}
        
        #创建备份
        return self.create_backup()
    
    def export_to_file(self, filepath: str, encrypt: bool = False) -> Dict:
        """导出到指定文件"""
        data = self._export_all_data()
        
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        
        try:
            if encrypt and self.cipher:
                encrypted = self.cipher.encrypt(json_data.encode('utf-8'))
                with open(filepath, 'wb') as f:
                    f.write(encrypted)
            else:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(json_data)
            
            return {
                'success': True,
                'filepath': filepath,
                'size': os.path.getsize(filepath)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def import_from_file(self, filepath: str) -> Dict:
        """从文件导入"""
        try:
            if filepath.endswith('.encrypted') and self.cipher:
                with open(filepath, 'rb') as f:
                    encrypted_data = f.read()
                json_str = self.cipher.decrypt(encrypted_data).decode('utf-8')
            else:
                with open(filepath, 'r', encoding='utf-8') as f:
                    json_str = f.read()
            
            data = json.loads(json_str)
            
            success = self._restore_data(data)
            
            return {
                'success': success,
                'backup_date': data.get('exported_at')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


def get_backup_summary() -> Dict:
    """获取备份摘要"""
    manager = BackupManager()
    backups = manager.list_backups()
    
    return {
        'total_backups': len(backups),
        'latest_backup': backups[0] if backups else None,
        'backup_dir': manager.backup_dir,
        'encryption_available': CRYPTO_AVAILABLE,
        'backups': backups[:10]
    }
