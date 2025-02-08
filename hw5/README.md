# Homework #5

Образ на Docker hub: **antonkurudinov/otus_hw4:1.0**
Собран под 2 платформы: **linux/amd64**, **linux/arm64/v8**
```
docker pull antonkurudinov/otus_hw5:1.0
```

Для интсрументария кода использовалась SDK для NodeJs от OpenTelemetry https://opentelemetry.io/docs/languages/js/getting-started/nodejs/

Prometheus и Grafana запущены в docker compose. Сбор метрик идет через Nginx-Ingress. При этом метрики формируются в backend. Нагрузка эмулируется через Postman.

Помимо стандартных метрик "из коробки" SDK добалена бинесовая метрика `my_users_count` - кол-во пользователей в таблице БД.

# Развертывание приложения в Kuber
Создать namespace **otus-hw5-anton**
```
kubectl create ns otus-hw5-anton
kubectl config set-context --current --namespace=otus-hw5-anton
```

Установить Postgres
```
helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql -f ./kuber/helm/values.yaml
```

Запустить развертывание приложения:
```
kubectl apply -f ./kuber
```

# Развертывание Prometheus и Grafana

docker-compose.yml в папке prometheus_grafana

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-hw5-anton
kubectl delete ns otus-hw5-anton
```

