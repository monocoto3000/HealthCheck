pipeline {
    agent any

    environment {
        NODE_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : env.BRANCH_NAME == 'qa' ? 'qa' : 'develop'}"
        EC2_USER = 'ubuntu'
        SSH_KEY = credentials('ssh-key-ec2')
        REMOTE_PATH = '/home/ubuntu/HealthCheck'

        EC2_IP = "${env.BRANCH_NAME == 'main' ? '52.45.170.88' : env.BRANCH_NAME == 'qa' ? '44.210.28.87' : '107.22.77.233'}"
        APP_NAME = "${env.BRANCH_NAME == 'main' ? 'health-prod' : env.BRANCH_NAME == 'qa' ? 'health-qa' : 'health-dev'}"
        APP_PORT = "${env.BRANCH_NAME == 'main' ? '3001' : '3000'}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${env.BRANCH_NAME}", url: 'https://github.com/monocoto3000/HealthCheck.git'
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
                script {
                    def envFile = """
                    NODE_ENV=${env.NODE_ENV}
                    PORT=${env.APP_PORT}
                    """

                    writeFile file: 'remote.env', text: envFile

                    sh """
                    scp -i $SSH_KEY -o StrictHostKeyChecking=no remote.env $EC2_USER@$EC2_IP:$REMOTE_PATH/.env
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP '
                        cd $REMOTE_PATH &&
                        git fetch --all &&
                        git reset --hard origin/${env.BRANCH_NAME} &&
                        npm ci &&
                        pm2 restart ${APP_NAME} || pm2 start server.js --name ${APP_NAME}
                    '
                    """
                }
            }
        }
    }
}
