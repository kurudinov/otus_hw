# Homework #8

Распределенная транзакция реализуется с помощью паттерна сага. Дефолтный сценарий интернет-магазина.

Оркестрацию выполняет сервис Order. Последовательно вызываются сервисы Billing (Платеж), ERP (Резервирование на складе), Delivery (Бронирование слота доставки). В случае отказа одного из сервисов Order запускает компенсирующие транзакции.

Большинство взаимодействий происходит асинхронно с помощью Kafka. Синхронный вызов только 1: запрос цены товара в ERP при создании заказа.

## Архитекурная схема:
![Архитекурная схема](Arch_schema.jpg?raw=true "Архитекурная схема")
Файл **Arch_schema.jpg**

На схеме черными стрелака указаны HTTP-вызовы. Синими стрелками - публикация либо подписка на события в Kafka.

## Статусы заказа:
![Статусы заказа](Order_statuses.jpg?raw=true "Статусы заказа")
Файл **Order_statuses.jpg**

## Образы на Docker
Образы на Docker hub cобраны под 2 платформы: **linux/amd64**, **linux/arm64/v8**:
- otus_hw8_auth:1.0
- otus_hw8_billing:1.0
- otus_hw8_order:1.0
- otus_hw8_notif:1.1
- otus_hw8_profile:1.1
- otus_hw8_erp:1.0
- otus_hw8_delivery:1.0

# Развертывание приложения в Kuber
1. Создать namespace **otus-anton**
```
kubectl create ns otus-anton
kubectl config set-context --current --namespace=otus-anton
```

2. Установить Postgres
```
helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql -f ./kuber/helm/values.yaml
```
Дождаться завершения создания контейнеров Postgres _(пока не понимаю, как это автоматизировать такое "дожидание"...)_

3. Установить Kafka
```
helm install franz oci://registry-1.docker.io/bitnamicharts/kafka  -f ./kuber/helm/valuesKafka.yaml
```
Дождаться завершения создания контейнеров Kafka

4. Запустить развертывание приложения:
```
kubectl apply -f ./kuber
```
Дождаться завершения создания контейнеров и Job (инициализация БД, создание топиков Kafka).

5. Запустить ingress контроллер _(если ранее еще не был запущен)_:
```
minikube addons enable ingress
minikube tunnel
```

# Тестирование приложения
Запуск коллекции newman с установкой переменной _baseUrl_ = http://arch.homework
```
newman run HW8.postman_collection.json --env-var baseUrl=http://arch.homework --verbose
```

Результаты (скриншоты) в файлах **newman_results_X.png**.
![Результат 1](newman_results_1.png?raw=true "Результат 1")
![Результат 2](newman_results_2.png?raw=true "Результат 2")
![Результат 3](newman_results_3.png?raw=true "Результат 3")
![Результат 4](newman_results_4.png?raw=true "Результат 4")
![Результат 5](newman_results_5.png?raw=true "Результат 5")
![Результат 6](newman_results_6.png?raw=true "Результат 6")
![Результат 7](newman_results_7.png?raw=true "Результат 7")
![Результат 8](newman_results_8.png?raw=true "Результат 8")

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-anton
kubectl delete ns otus-anton
```