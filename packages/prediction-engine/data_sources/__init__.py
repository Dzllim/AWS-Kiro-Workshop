"""Data source adapters with swappable interface. (Req 12.1)"""
from .interface import DataSourceInterface
from .openfootball import OpenFootballAdapter
from .clubelo import ClubEloAdapter
from .kaggle_adapter import KaggleAdapter
