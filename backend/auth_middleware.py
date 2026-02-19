"""
auth_middleware.py
──────────────────
JWT authentication helpers and role-based access decorators.

Usage:
    from auth_middleware import jwt_required_decorator, require_custodian, require_faculty, get_current_user

    @app.route('/api/protected')
    @jwt_required_decorator
    def protected():
        user = get_current_user()
        return jsonify(user.to_dict())
"""

from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import db, User


def get_current_user():
    """Decode JWT and return the User object stored in Flask's g context.
    Must be called inside a route decorated with @jwt_required_decorator.
    """
    return g.get('current_user')


def jwt_required_decorator(fn):
    """Decorator that validates the JWT Bearer token in the Authorization header.
    On success, loads the User into g.current_user for the request lifetime.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Step 1: verify the JWT token itself
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
        except Exception as e:
            return jsonify({'error': 'Invalid or expired token', 'detail': str(e)}), 401

        # Step 2: load the user from DB
        # Cast to int — flask-jwt-extended may return identity as string
        try:
            print(f"🔑 JWT identity: {user_id!r} (type={type(user_id).__name__})")
            user = db.session.get(User, int(user_id))
            if not user:
                print(f"❌ No user found for id={user_id}")
                return jsonify({'error': 'User not found — please log in again'}), 401
            print(f"✅ Authenticated: {user.name} ({user.role})")
            g.current_user = user
            return fn(*args, **kwargs)
        except Exception as e:
            print(f"❌ Auth middleware DB error: {str(e)}")
            return jsonify({'error': 'Server error during authentication', 'detail': str(e)}), 500
    return wrapper





def require_custodian(fn):
    """Decorator that enforces custodian-only access.
    Must be stacked AFTER @jwt_required_decorator.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != 'custodian':
            return jsonify({'error': 'Custodian access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def require_faculty(fn):
    """Decorator that enforces faculty (teacher/external evaluator) access.
    Must be stacked AFTER @jwt_required_decorator.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user or user.role not in ('faculty', 'custodian'):
            return jsonify({'error': 'Faculty access required'}), 403
        return fn(*args, **kwargs)
    return wrapper
