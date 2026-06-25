"""SOULDAWN — FSM states for broadcast flow."""
from aiogram.fsm.state import State, StatesGroup


class BroadcastStates(StatesGroup):
    waiting_for_content = State()
