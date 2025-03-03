# Project Online Shop

Материалы для защиты:
https://disk.yandex.ru/d/9LZAD51kHd9l_A

## Образы на Docker
Образы на Docker hub cобраны под 2 платформы: **linux/amd64**, **linux/arm64/v8**:
- otus_hw10_auth:1.0
- otus_hw10_billing:1.0
- otus_hw10_order:1.0
- otus_hw10_notif:1.0
- otus_hw10_profile:1.0
- otus_hw10_erp:1.0
- otus_hw10_delivery:1.0

# Развертывание приложения в Kuber
1. Запусти minikube и создать namespace **otus-anton**
```
minikube start

minikube addons enable ingress
minikube tunnel

kubectl create ns otus-anton
kubectl config set-context --current --namespace=otus-anton
```

2. Установить Postgres
```
helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql -f ./kuber/helm/values.yaml
```

3. Установить Kafka
```
helm install franz oci://registry-1.docker.io/bitnamicharts/kafka  -f ./kuber/helm/valuesKafka.yaml
```

4. Запустить развертывание приложения:
```
kubectl apply -f ./kuber
```


5. Мониторинг
```
helm install prometheus oci://registry-1.docker.io/bitnamicharts/prometheus -f ./kuber/helm/prometheus_values.yaml

helm install grafana oci://registry-1.docker.io/bitnamicharts/grafana -f ./kuber/helm/grafana_values.yaml
```

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack
```
Grafana:
user: `admin`
password: `admin`

# Тестирование приложения
Тестами покрыта проверка идемпотентности создания заказа.
Запуск коллекции newman с установкой переменной _baseUrl_ = http://arch.homework
```
newman run HW10.postman_collection.json --env-var baseUrl=http://arch.homework --verbose
```

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-anton
kubectl delete ns otus-anton

kubectl delete --all
```