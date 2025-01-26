# Homework #3

Образ на Docker hub: **antonkurudinov/otus_hw3:1.0**
Собран под 2 платформы: **linux/amd64**, **linux/arm64/v8**
```
docker pull antonkurudinov/otus_hw3:1.0
```

# Развертывание приложения в Kuber
Создать namespace **otus-hw3-anton**
```
kubectl create ns otus-hw3-anton
kubectl config set-context --current --namespace=otus-hw3-anton
```
Запустить развертывание
```
cd hw3/kuber
kubectl apply -f .
```

# Тестирование приложения
```
newman run Hw3.postman_collection.json
```

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-hw3-anton
kubectl delete ns otus-hw3-anton
```

