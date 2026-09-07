# ============================================
# GoldAlert — Semi-Automated Reddit Posting Tool
# ============================================
# Run this in Google Colab (colab.research.google.com), NOT unattended/scheduled.
# Designed to be triggered manually by the site owner, with a built-in 14-day
# cooldown per subreddit to avoid looking like spam to Reddit's detection systems.
#
# Setup (one-time):
#   1. reddit.com/prefs/apps -> "create another app..." -> type "script"
#      redirect uri: http://localhost:8080
#   2. Note the client_id (short code under the app name) and client_secret.
#   3. Paste this whole file into a Google Colab notebook (two cells, split at
#      the "SEL 2" marker below), or run it as-is in one cell.
#
# Safety notes:
#   - Always run with dry_run=True first to preview the draft before posting.
#   - Read each subreddit's rules before your first post there — many gold/metals
#     communities restrict self-promotion to specific days/threads.
#   - Genuinely participate in a subreddit's discussions before posting your own
#     tool there; accounts that post links immediately after joining are the
#     most common pattern moderators and Reddit's own spam filters flag.

# ============================================
# SEL 1 — Setup (run once per Colab session)
# ============================================
get_ipython().system('pip install praw --quiet')

import praw, json, os
from datetime import datetime
from getpass import getpass

from google.colab import drive
drive.mount('/content/drive')
LOG_PATH = '/content/drive/MyDrive/goldalert_reddit_log.json'

client_id = getpass("Client ID: ")
client_secret = getpass("Client Secret: ")
username = input("Reddit username (no u/): ")
password = getpass("Reddit password: ")

reddit = praw.Reddit(
    client_id=client_id,
    client_secret=client_secret,
    username=username,
    password=password,
    user_agent="goldalert-poster/1.0 by u/" + username
)
print("Connected as:", reddit.user.me())

# ============================================
# SEL 2 — Posting tool (run whenever you want to post)
# ============================================
COOLDOWN_DAYS = 14

DRAFTS = {
    "PreciousMetals": {
        "title": "Built a free multi-asset gold pullback tracker — feedback welcome",
        "body": """I got tired of checking gold, silver, miners, and gold ETFs across five different tabs, so I built a simple tool that puts them all on one board with a basic rule-based signal (3+ down days = watch, 5+ = strong).

It's free, no login, no ads yet, covers gold/silver spot, 4 miners (AU, KGC, HMY, GFI), GDX/GLD/SLV, and PAXG/XAUT for anyone into gold-backed crypto.

Not investment advice — it's literally just "how many red days in a row," transparently explained on the methodology page. Built it mostly for myself, figured others here might find it useful too.

goldalert.org — happy to hear what's missing or what you'd want tracked differently."""
    },
    "Gold": {
        "title": "Made a simple tool to track gold pullbacks across metals, miners, ETFs and crypto",
        "body": """Wanted something that shows gold, silver, mining stocks, ETFs and gold-backed tokens together instead of jumping between sites. Ended up building it myself — free, no account needed.

The "signal" is dead simple on purpose: consecutive down days, nothing fancier. Full rules are on the site if anyone's curious how it's calculated.

Would genuinely appreciate feedback if anyone tries it — goldalert.org"""
    },
}

def load_log():
    if os.path.exists(LOG_PATH):
        return json.load(open(LOG_PATH))
    return {}

def save_log(log):
    json.dump(log, open(LOG_PATH, 'w'), indent=2)

def check_and_post(subreddit_name, dry_run=True):
    log = load_log()
    last = log.get(subreddit_name)
    if last:
        last_date = datetime.fromisoformat(last)
        days_since = (datetime.now() - last_date).days
        if days_since < COOLDOWN_DAYS:
            print(f"Not yet — last posted to r/{subreddit_name} {days_since} day(s) ago.")
            print(f"   Can post again in {COOLDOWN_DAYS - days_since} day(s).")
            return

    draft = DRAFTS[subreddit_name]
    print(f"=== Draft for r/{subreddit_name} ===")
    print("Title:", draft["title"])
    print("\nBody:\n", draft["body"])
    print("\n" + "="*50)

    if dry_run:
        print("PREVIEW MODE — nothing posted yet.")
        print("   Set dry_run=False below once you're happy with it.")
        return

    submission = reddit.subreddit(subreddit_name).submit(
        title=draft["title"], selftext=draft["body"]
    )
    log[subreddit_name] = datetime.now().isoformat()
    save_log(log)
    print(f"Posted: {submission.url}")


# --- EDIT THESE TWO LINES AS NEEDED ---
check_and_post("PreciousMetals", dry_run=True)   # preview first
# check_and_post("PreciousMetals", dry_run=False)  # run this once you're sure
