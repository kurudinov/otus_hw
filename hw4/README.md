# Homework #3

Образ на Docker hub: **antonkurudinov/otus_hw4:1.0**
Собран под 2 платформы: **linux/amd64**, **linux/arm64/v8**
```
docker pull antonkurudinov/otus_hw4:1.0
```

# Развертывание приложения в Kuber
Создать namespace **otus-hw4-anton**
```
kubectl create ns otus-hw4-anton
kubectl config set-context --current --namespace=otus-hw4-anton
```

Установить Postgres
```
helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql -f ./kuber/helm/values.yaml
```

Запустить развертывание приложения:
```
kubectl apply -f ./kuber
```

# Тестирование приложения
```
newman run Hw3.postman_collection.json
```

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-hw4-anton
kubectl delete ns otus-hw4-anton
```

