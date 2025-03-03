# auth
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_auth:1.0 ./src/auth && docker push antonkurudinov/otus_hw10_auth:1.0
# billing
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_billing:1.0 ./src/billing && docker push antonkurudinov/otus_hw10_billing:1.0
# notif
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_notif:1.0 ./src/notif && docker push antonkurudinov/otus_hw10_notif:1.0
# order
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_order:1.0 ./src/order && docker push antonkurudinov/otus_hw10_order:1.0
# profile
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_profile:1.0 ./src/profile && docker push antonkurudinov/otus_hw10_profile:1.0
# erp
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_erp:1.0 ./src/erp && docker push antonkurudinov/otus_hw10_erp:1.0
# delivery
docker build --platform linux/amd64,linux/arm64/v8 -t antonkurudinov/otus_hw10_delivery:1.0 ./src/delivery && docker push antonkurudinov/otus_hw10_delivery:1.0
