#!/usr/bin/env python3
import sys
sys.path.insert(0, 'd:/PersonalProject/api')

from app import app

print("="*50)
print("已注册的Flask路由：")
print("="*50)

for rule in app.url_map.iter_rules():
    methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
    print(f"{methods:10} {rule.rule}")

print("="*50)
