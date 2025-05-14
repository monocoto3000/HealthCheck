pipeline {
    agent any

    environment {
        NODE_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : (env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'QA') ? 'qa' : 'develop'}"
        EC2_USER = 'ubuntu'
        EC2_IP_DEV = '107.22.77.233'
        EC2_IP_QA = '44.210.28.87'
        EC2_IP_PROD = '52.45.170.88'
        REMOTE_PATH_DEV = '/home/ubuntu/HealthCheck'
        REMOTE_PATH_QA = '/home/ubuntu/HealthCheck'
        REMOTE_PATH_PROD = '/home/ubuntu/HealthCheck'
        APP_NAME = "${env.BRANCH_NAME == 'main' ? 'health' : (env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'QA') ? 'health-qa' : 'health-dev'}"
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Trabajando en la rama: ${env.BRANCH_NAME}"
                }
            }
        }

        stage('Build') {
            steps {
                sh 'rm -rf node_modules'
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test || echo "No hay tests o fallaron, pero continuamos..."'
            }
        }

        stage('Deploy') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' ||
                           env.BRANCH_NAME == 'qa' ||
                           env.BRANCH_NAME == 'main'
                }
            }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ssh-key-ec2', keyFileVariable: 'SSH_KEY_FILE')]) {
                    script {
                        def EC2_IP = ''
                        def REMOTE_PATH = ''
                        def APP_PORT = '3000'

                        if (env.BRANCH_NAME == 'main') {
                            EC2_IP = EC2_IP_PROD
                            REMOTE_PATH = REMOTE_PATH_PROD
                            APP_PORT = '3001'
                            input message: '🚨 ¿Confirmar despliegue a PRODUCCIÓN?'
                        } else if (env.BRANCH_NAME == 'qa' || env.BRANCH_NAME == 'QA') {
                            EC2_IP = EC2_IP_QA
                            REMOTE_PATH = REMOTE_PATH_QA
                        } else {
                            EC2_IP = EC2_IP_DEV
                            REMOTE_PATH = REMOTE_PATH_DEV
                        }

                        echo "🚀 Desplegando en ${NODE_ENV} (${EC2_IP}) con puerto ${APP_PORT}"

                        def envContent = """
                        NODE_ENV=${NODE_ENV}
                        PORT=${APP_PORT}
                        API_URL=https://api${NODE_ENV == 'production' ? '' : '-' + NODE_ENV}.example.com
                        """

                        sh """
                        ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} '
                            sudo chown -R ubuntu:ubuntu ${REMOTE_PATH} || true
                            mkdir -p ${REMOTE_PATH}
                            sudo chown -R ubuntu:ubuntu ${REMOTE_PATH}
                            sudo chmod -R 755 ${REMOTE_PATH}

                            git config --global --add safe.directory ${REMOTE_PATH}
                            cd ${REMOTE_PATH}
                            git fetch --all
                            git checkout ${env.BRANCH_NAME}
                            git reset --hard origin/${env.BRANCH_NAME}
                            npm ci
                        '
                        """

                        sh """
                        echo '${envContent}' | ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} 'cat > ${REMOTE_PATH}/.env'
                        """

                        sh """
                        ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} '
                            cd ${REMOTE_PATH}
                            pm2 restart ${APP_NAME} || pm2 start server.js --name ${APP_NAME}
                        '
                        """

                        echo "✅ Despliegue en ${NODE_ENV} completado con éxito!"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "🎉 ¡Pipeline exitoso en ${env.BRANCH_NAME}!"
        }
        failure {
            echo "❌ Fallo en ${env.BRANCH_NAME}. Verifica los logs."
        }
    }
}
