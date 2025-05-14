pipeline {
    agent any

    environment {
        EC2_USER = 'ubuntu'
        SSH_KEY = credentials('ssh-key-ec2')
        REMOTE_PATH = '/home/ubuntu/HealthCheck'
    }

    stages {
        stage('Init') {
            steps {
                script {
                    // Determina rama y entorno
                    BRANCH_NAME = env.BRANCH_NAME ?: 'main' // Jenkins lo inyecta automáticamente
                    NODE_ENV = BRANCH_NAME == 'main' ? 'production' : (BRANCH_NAME == 'qa' ? 'qa' : 'develop')
                    EC2_IP = BRANCH_NAME == 'main' ? '52.45.170.88' : (BRANCH_NAME == 'qa' ? '44.210.28.87' : '107.22.77.233')
                    APP_NAME = BRANCH_NAME == 'main' ? 'health' : (BRANCH_NAME == 'qa' ? 'health-qa' : 'health-dev')

                    echo "Rama: ${BRANCH_NAME}"
                    echo "Entorno: ${NODE_ENV}"
                    echo "IP destino: ${EC2_IP}"
                    echo "App PM2: ${APP_NAME}"
                }
            }
        }

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
                    def envContent = """
                    NODE_ENV=${NODE_ENV}
                    PORT=${NODE_ENV == 'production' ? '3001' : '3000'}
                    """

                    // Subir .env al servidor
                    sh """
                    echo '${envContent}' | ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cat > $REMOTE_PATH/.env'
                    """

                    // Desplegar y reiniciar
                    sh """
                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP '
                        cd $REMOTE_PATH &&
                        git fetch --all &&
                        git checkout ${BRANCH_NAME} &&
                        git reset --hard origin/${BRANCH_NAME} &&
                        npm ci &&
                        pm2 restart ${APP_NAME} || pm2 start server.js --name ${APP_NAME}
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Despliegue exitoso de la rama ${env.BRANCH_NAME}"
        }
        failure {
            echo "❌ Falló el despliegue de la rama ${env.BRANCH_NAME}"
        }
    }
}
