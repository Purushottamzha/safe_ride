import json, sys

data = {
    "users": [
        {
            "username": "saferide-backend",
            "passwordHash": "$7$1000$8zQBhw+06GO+HLrWwfvspMnV6+iQAvn1RR6oHUu3YhoynHiUMvJJgTCmP/O7T2T4E/pLNJUMt3Ch9ep1XZR1/w==$sLYga0bWrEUhVmfPze4cd3vu6pYsx3FAWsFj53rBMWZ8DEnGjhfEFvVBqQ5vBAvrx9vUNLVrpfrYKb7RS58qCw==",
        },
        {
            "username": "saferide-health",
            "passwordHash": "$7$1000$6vQY8ucrIybAXiM1tCqrUn7zeToXmuKjcMAf4uTf2MvXGnO/duSyivHU5HTzOVU2T7kumtFOwsS2MxFyRUXhVg==$vdXRbV7+0iOQWyGsxfXgQ6szxhqtC95ipeaU+vPfMZ/iQyl36brwq5Km9X2g4NZXLIy4/CsQ0PBT7tNCM1p7zg==",
        },
    ],
    "devices": [
        {
            "deviceId": "bus001-test",
            "schoolId": "ba43ebb0-a4d9-4185-a1e1-292048ee0bec",
            "busId": "7cac89bc-2b4e-475b-8988-4b6324583cd5",
            "passwordHash": "$7$1000$KHmnS/LeMWAoGliDwOZ2gd3Tp/CD66EouP1JNHDQqiH36+LQgiZJoVkBsT0XwWK8eEaaI8gynoMa25xq7Bi+rQ==$ew/YIiBCwh3FVqlHL4aVbGj+tqmx05eePjcgwq9SyXakYCQcTe8fW0yudsH3QPoSjh4kue/u8AjAC8qD6vZ0GA==",
        },
    ],
}
json.dump(data, sys.stdout, indent=2)
