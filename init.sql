SELECT 'CREATE DATABASE usermart_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'usermart_db')\gexec

SELECT 'CREATE DATABASE ordermart_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ordermart_db')\gexec

SELECT 'CREATE DATABASE paymentmart_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'paymentmart_db')\gexec
