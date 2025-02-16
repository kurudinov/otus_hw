# Homework #5

Архитекурная схема:
![Архитекурная схема](Arch_schema.jpg?raw=true "Архитекурная схема")
Файл **Arch_schema.jpg**

Реализованы 2 сервиса: App и Auth

В качестве API Gateway используется nginx-ingress. 
Запросы на регистрацию и аутентифиакцию (получение JWT токена по логину/паролю) проксируются на Auth без изменений.
Запросы к бизнес-сервису App перенаправляются в сервис Auth. Он валидирует JWT токен и в случае успеха добавляет заголовки: X-UserId, X-UserEmail, X-UserRoles. Далее запрос с доп.заголовками перенаправляется к бизнес-сервису. Бизнес-сервис App использует заголовок X-UserId для определения контекста текущего пользователя и работы с его профилем.

Образ на Docker hub: **antonkurudinov/otus_hw6_app:1.7** и **antonkurudinov/otus_hw6_auth:1.7**
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
Запуск коллекции newman с учатновкой переменной _baseUrl_ = http://arch.homework
```
newman run HW6.postman_collection.json --env-var baseUrl=http://arch.homework
```

Результат (скриншот) в файле **newman_test_results.png**.
![Результат](newman_test_results.png?raw=true "Результат")

# Удаление приложения (всего содержимого namespace)
```
kubectl delete all --all -n otus-hw6-anton
kubectl delete ns otus-hw6-anton
```

