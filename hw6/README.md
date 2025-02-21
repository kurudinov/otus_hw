# Homework #6

Доработано ДЗ #6 по замечаниям:
- Реализована выдача JWT сервисом Auth и его проверка сервисом Profile (сервис работы с профилем пользователя)
- Отказался от использования nginx-ingress для установки аутентифицирующих headers
- Микросервисы Auth и Profile теперь полностью разнесены: по разным веткам кода и схемам БД 
- JWT дополнительно записывается в cookie "access_token" для удобства клиента
- реализован метод logout, который чистит cookie "access_token" на клиенте

Новая архитекурная схема:
![Архитекурная схема](Arch_schema_v2.jpg?raw=true "Архитекурная схема")
Файл **Arch_schema_v2.jpg**


Образы на Docker hub: **antonkurudinov/otus_hw6_profile:2.3** и **antonkurudinov/otus_hw6_auth:1.7**
Собраны под 2 платформы: **linux/amd64**, **linux/arm64/v8**


# Развертывание приложения в Kuber
Создать namespace **otus-hw6-anton**
```
kubectl create ns otus-hw6-anton
kubectl config set-context --current --namespace=otus-hw6-anton
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
Запуск коллекции newman с установкой переменной _baseUrl_ = http://arch.homework
```
newman run HW6v2.postman_collection.json --env-var baseUrl=http://arch.homework --verbose
```

Результат (скриншот) в файлах **newman_results_X.png**.
![Результат 1](newman_results_1.png?raw=true "Результат 1")
![Результат 2](newman_results_2.png?raw=true "Результат 2")
![Результат 3](newman_results_3.png?raw=true "Результат 3")
![Результат 4](newman_results_4.png?raw=true "Результат 4")

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-hw6-anton
kubectl delete ns otus-hw6-anton
```

