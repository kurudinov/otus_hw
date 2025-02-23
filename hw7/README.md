# Homework #7

Для взаимодействия сервисов был выбран вариант Event Collaboration с помощью брокера Kafka.

Архитекурная схема:
![Архитекурная схема](Arch_schema.jpg?raw=true "Архитекурная схема")
Файл **Arch_schema.jpg**

На схеме черными стрелака указаны HTTP-вызовы. Синими стрелками - отправка либо прием сообщений в Kafka.

Образы на Docker hub Собраны под 2 платформы: **linux/amd64**, **linux/arm64/v8**:
- otus_hw7_auth:1.0
- otus_hw7_billing:1.0
- otus_hw7_order:1.0
- otus_hw7_notif:1.0
- otus_hw7_profile:1.0

# Развертывание приложения в Kuber
1. Создать namespace **otus-anton**
```
kubectl create ns otus-anton
kubectl config set-context --current --namespace=otus-anton
```

2. Установить Postgres
`helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql -f ./kuber/helm/values.yaml`
Дождаться завершения создания контейнеров Postgres _(пока не понимаю, как это автоматизировать такое "дожидание"...)_

3. Установить Kafka
`helm install franz oci://registry-1.docker.io/bitnamicharts/kafka  -f ./kuber/helm/valuesKafka.yaml`
Дождаться завершения создания контейнеров Kafka

4. Создать топики в Kafka с помощью CLI _(пока не понимаю, как это автоматизировать манифестами...)_
```
kubectl run franz-kafka-client --restart='Never' --image docker.io/bitnami/kafka:3.9.0-debian-12-r10 --namespace otus-anton --command -- sleep infinity
kubectl exec --tty -i franz-kafka-client --namespace otus-anton -- bash

    kafka-topics.sh --create --bootstrap-server franz-kafka.otus-anton.svc.cluster.local:9092 --topic auth.user_registered
    kafka-topics.sh --create --bootstrap-server franz-kafka.otus-anton.svc.cluster.local:9092 --topic order.order_changed
    kafka-topics.sh --create --bootstrap-server franz-kafka.otus-anton.svc.cluster.local:9092 --topic billing.payment_result
```

5. Запустить развертывание приложения:
`kubectl apply -f ./kuber`
Дождаться завершения создания контейнеров

6. Запустить ingress контроллер _(если ранее еще не был запущен)_:
```
minikube addons enable ingress
minikube tunnel
```

# Тестирование приложения
Запуск коллекции newman с установкой переменной _baseUrl_ = http://arch.homework
`newman run HW7.postman_collection.json --env-var baseUrl=http://arch.homework --verbose`

Результаты (скриншоты) в файлах **newman_results_X.png**.
![Результат 1](newman_results_1.png?raw=true "Результат 1")
![Результат 2](newman_results_2.png?raw=true "Результат 2")
![Результат 3](newman_results_3.png?raw=true "Результат 3")
![Результат 4](newman_results_4.png?raw=true "Результат 4")

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-anton
kubectl delete ns otus-anton
```