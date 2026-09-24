"""
Water Futures — Superset Configuration
Water-themed palettes (one per tab) + public access.
"""
import os

# =============================================================================
# Database
# =============================================================================
SQLALCHEMY_DATABASE_URI = (
    f"postgresql+psycopg2://"
    f"{os.getenv('DATABASE_USER', 'superset')}:"
    f"{os.getenv('DATABASE_PASSWORD', 'superset_secret')}@"
    f"{os.getenv('DATABASE_HOST', 'postgres')}:"
    f"{os.getenv('DATABASE_PORT', '5432')}/"
    f"{os.getenv('DATABASE_DB', 'superset')}"
)
SECRET_KEY = os.getenv("SUPERSET_SECRET_KEY", "water_futures_2026_secret_key_xyz789_change_in_prod")

# =============================================================================
# Redis cache
# =============================================================================
CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_wf_",
    "CACHE_REDIS_HOST": os.getenv("REDIS_HOST", "redis"),
    "CACHE_REDIS_PORT": int(os.getenv("REDIS_PORT", 6379)),
    "CACHE_REDIS_DB": 1,
}
DATA_CACHE_CONFIG = {**CACHE_CONFIG, "CACHE_REDIS_DB": 2}

# =============================================================================
# Feature flags
# =============================================================================
FEATURE_FLAGS = {
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "GLOBAL_ASYNC_QUERIES": False,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ALLOW_ADHOC_SUBQUERY": True,
    "EMBEDDABLE_CHARTS": True,
}

# =============================================================================
# Public / sharing access
# =============================================================================
PUBLIC_ROLE_LIKE_GAMMA = True          # Public role gets read-only (Gamma) access
WTF_CSRF_ENABLED = True
SESSION_COOKIE_SECURE = False
TALISMAN_ENABLED = False

# =============================================================================
# Water Futures Thematic Color Palettes
#
# Each tab uses one family of related hues — no cross-tab color clashes.
#
# Tab 1  Azure Blue   the problem, scale, urgency of scale
# Tab 2  Coral        urgency ranking, heat
# Tab 3  Aqua Teal    governance, equity, action
# Tab 4  Indigo       model, method, trust
# Tab 5  Warm Amber   business case, value
# =============================================================================
EXTRA_CATEGORICAL_COLOR_SCHEMES = [
    # ---- Tab 1: Azure Blue ---------------------------------------------------
    {
        "id": "wfTab1Azure",
        "label": "WF T1 - Azure",
        "isDefault": True,
        "colors": [
            "#0284C7",
            "#0EA5E9",
            "#0369A1",
            "#38BDF8",
            "#075985",
            "#7DD3FC",
            "#0C4A6E",
        ],
    },
    # ---- Tab 2: Coral Crimson --------------------------------------------------
    {
        "id": "wfTab2Coral",
        "label": "WF T2 - Coral",
        "isDefault": False,
        "colors": [
            "#E11D48",
            "#F97316",
            "#DC2626",
            "#FB923C",
            "#EA580C",
            "#FDBA74",
            "#991B1B",
        ],
    },
    # ---- Tab 3: Aqua Teal --------------------------------------------------------
    {
        "id": "wfTab3Teal",
        "label": "WF T3 - Aqua Teal",
        "isDefault": False,
        "colors": [
            "#0D9488",
            "#14B8A6",
            "#0F766E",
            "#2DD4BF",
            "#134E4A",
            "#99F6E4",
            "#042F2E",
        ],
    },
    # ---- Tab 4: Indigo -------------------------------------------------------------
    {
        "id": "wfTab4Indigo",
        "label": "WF T4 - Indigo",
        "isDefault": False,
        "colors": [
            "#7C3AED",
            "#8B5CF6",
            "#6D28D9",
            "#A78BFA",
            "#4338CA",
            "#C7D2FE",
            "#1E1B4B",
        ],
    },
    # ---- Tab 5: Warm Amber ----------------------------------------------------------
    {
        "id": "wfTab5Amber",
        "label": "WF T5 - Amber",
        "isDefault": False,
        "colors": [
            "#D97706",
            "#F59E0B",
            "#B45309",
            "#FBBF24",
            "#78350F",
            "#FDE68A",
            "#1C1917",
        ],
    },
]

# Urgency tier semantic colors (used on pies/labels)
TIER_LABEL_COLORS = {
    "Critical": "#DC2626",
    "High": "#F97316",
    "Moderate": "#FACC15",
    "Low": "#16A34A",
    "Low Governance": "#DC2626",
}

EXTRA_SEQUENTIAL_COLOR_SCHEMES = []
ROW_LIMIT = 10000
SUPERSET_DASHBOARD_POSITION_DATA_LIMIT = 65535