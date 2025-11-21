pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = "walidbannouri"
        DOCKER_IMAGE_NAME = "node-todo-safe"
        FIXED_TAG = "latest"
        FULL_IMAGE_NAME = "${DOCKER_HUB_USER}/${DOCKER_IMAGE_NAME}:${FIXED_TAG}"
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                echo "Building image: ${FULL_IMAGE_NAME} from Dockerfile.secure"
                docker build -t ${DOCKER_IMAGE_NAME} -f dockerfile.secure .
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image --severity CRITICAL --exit-code 1 ${DOCKER_IMAGE_NAME} || TRIVY_EXIT=$?

                if [ "${TRIVY_EXIT}" = "1" ]; then
                    echo "Trivy found CRITICAL vulnerabilities. Failing build."
                    exit 1
                fi
                '''
            }
        }

        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh '''
                    docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}
                    docker tag ${DOCKER_IMAGE_NAME} ${FULL_IMAGE_NAME}
                    docker push ${FULL_IMAGE_NAME}
                    '''
                }
            }
        }

        stage('Deploy MongoDB') {
            steps {
                sh '''
                kubectl apply -f k8s/mongo-deployment.yaml
                kubectl rollout status deployment/mongo
                '''
            }
        }

        stage('Create Kubernetes Secret') {
            steps {
                withCredentials([string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI')]) {
                    sh '''
                    kubectl create secret generic todo-secret \
                        --from-literal=MONGO_URI=$MONGO_URI \
                        --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Deploy Node TODO App') {
            steps {
                sh '''
                kubectl apply -f k8s/deployment.yaml
                kubectl apply -f k8s/service.yaml
                kubectl rollout status deployment/node-todo

                echo "Waiting 10 seconds for pods to initialize..."
                sleep 10

                kubectl get pods -l app=node-todo
                kubectl get svc node-todo-svc
                '''
            }
        }

        stage('Deploy Falco') {
            steps {
                sh '''
                echo "Adding Falco Helm repo..."
                helm repo add falcosecurity https://falcosecurity.github.io/charts || true
                helm repo update

                echo "Deploying Falco..."
                helm upgrade --install falco falcosecurity/falco \
                    --namespace falco \
                    --create-namespace

                echo "Waiting 20 seconds for Falco to start..."
                sleep 20

                kubectl get pods -n falco
                '''
            }
        }

        stage('Simulate Threat') {
            steps {
                script {
                    sh '''
                    echo "Simulating malicious behavior..."

                    MONGO_POD=$(kubectl get pods -l app=mongo -o jsonpath="{.items[0].metadata.name}")

                    echo "Target pod: $MONGO_POD"

                    # kubectl exec -it ${MONGO_POD} -- sh
                    # exit

                    echo "Waiting 120 seconds for simulating the attack..."
                    sleep 120

                    # echo "--- Falco Logs ---"
                    # kubectl logs -n falco -l app.kubernetes.io/name=falco --tail=50
                    '''
                }
            }
        }
    }

    post {
        always {
            echo '--- GLOBAL CLEANUP ---'
            sh '''
            echo "Deleting MongoDB, App, Services, Secrets..."
            kubectl delete deployment/mongo service/mongo deployment/node-todo service/node-todo-svc secret/todo-secret --ignore-not-found

            echo "Deleting Falco Helm release..."
            helm uninstall falco -n falco || true
            kubectl delete namespace falco --ignore-not-found

            echo "Removing local Docker images..."
            docker rmi ${DOCKER_IMAGE_NAME} || true
            docker rmi ${FULL_IMAGE_NAME} || true

            echo "Cleanup finished."
            '''
        }
    }
}
