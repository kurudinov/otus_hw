# Homework #9

Идемпотентность реализована для HTTP-метода создания заказа. Входящий запрос должен содержать заголовок X-RequestId, устанавливаемый клиентом. Значение заголовка сохраняется в таблицу заказов 'Orders' и проверяется  при попытке создания нового заказа. Если в таблице уже есть заказ с таким же X-RequestId для текущего пользователя, то новый заказ не создается, а выдается код 201 с номером найденного заказа.

Идемпотентность также реализована для сарвиса оплаты заказа, который срабатывает при приему сообщения из топика 'billing.payment.request' Kafka. Статус оплаты каждого заказа сохраняется в таблицу БД 'OrderPayment'. При приходе нового запроса на оплату, номер заказа проверяется по таблице. В случае, если ранее заказ уже был оплачен (статус 'PAID'), запрос игнорируется.


## Архитекурная схема:
![Архитекурная схема](Arch_schema.jpg?raw=true "Архитекурная схема")
Файл **Arch_schema.jpg**

На схеме черными стрелака указаны HTTP-вызовы. Синими стрелками - публикация либо подписка на события в Kafka.


## Статусы заказа:
![Статусы заказа](Order_statuses.jpg?raw=true "Статусы заказа")
Файл **Order_statuses.jpg**

## Образы на Docker
Образы на Docker hub cобраны под 2 платформы: **linux/amd64**, **linux/arm64/v8**:
- otus_hw9_auth:1.0
- otus_hw9_billing:1.0
- otus_hw9_order:1.0
- otus_hw9_notif:1.1
- otus_hw9_profile:1.1
- otus_hw9_erp:1.0
- otus_hw9_delivery:1.0

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
Тестами покрыта проверка идемпотентности создания заказа.
Запуск коллекции newman с установкой переменной _baseUrl_ = http://arch.homework
```
newman run HW9.postman_collection.json --env-var baseUrl=http://arch.homework --verbose
```

Результаты (скриншоты) в файлах **newman_results_X.png**.
![Результат 1](newman_results_1.png?raw=true "Результат 1")
![Результат 2](newman_results_2.png?raw=true "Результат 2")
![Результат 3](newman_results_3.png?raw=true "Результат 3")

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-anton
kubectl delete ns otus-anton
```