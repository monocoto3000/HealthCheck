pipeline {
    agent any

    environment {
        NODE_ENV = 'develop'
        EC2_USER = 'ubuntu'
        EC2_IP = '107.22.77.233'
        REMOTE_PATH = '/home/ubuntu/HealthCheck'
        SSH_KEY = credentials('ssh-key-ec2')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/monocoto3000/HealthCheck.git'
            }
        }

        stage('Build') {
            steps {
                sh 'rm -rf node_modules'
                sh 'npm ci'
            }
        }

        stage('Deploy') {
            steps {
                sh """
                ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP '
                    cd $REMOTE_PATH &&
                    git pull origin develop &&
                    npm ci &&
                    pm2 restart health-api || pm2 start server.js --name health-api
                '
                """
            }
        }
    }
}
