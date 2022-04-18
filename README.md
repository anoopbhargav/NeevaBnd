# Run Application on local

## Download Node And Python

Install Node V14 from [https://nodejs.org/en/download/]
(https://nodejs.org/en/download/)
for Python(3.10.1 Or Latest one) Download And Install From [https://www.python.org/downloads/](https://www.python.org/downloads/)

### Install Python Dependency

```bash
    pip install numpy
    pip install -U scikit-learn
```

### Install Node Dependency

Clone git, navigate to backend folder and install dependancies

```bash
    npm install
```

Create dotenv file (.env) and add

```bash
JWT_SECRET

REDSHIFT_DBNAME
REDSHIFT_DBUSER
REDSHIFT_DBPASSWORD
REDSHIFT_DBHOST

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SESSION_SECRET
```

## Run Application

```bash
    npm start
```

    Wait till app starts on port 5000
    App is running at http://localhost:5000

## Stop The Application

```bash
    ctrl + c
```

### Steps To Get GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET

go to [https://console.cloud.google.com/projectselector2/apis](https://console.cloud.google.com/projectselector2/apis)
click on credentials and edit your OAuth 2.0 and select Client IDs & Client secret
