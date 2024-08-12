aws dynamodb put-item \
    --table-name products \
    --item \
        '{"id": {"S": "ac335277-149b-4cb9-a51a-90a51bf819bb"}, "title": {"S": "Travel three"}, "description": {"S": "Travel to the moon"}, "price": {"N": "2000000"}}'
aws dynamodb put-item \
    --table-name products \
    --item \
        '{"id": {"S": "3b4f6e07-d230-4c59-bdb7-7ec1da3d2733"}, "title": {"S": "Travel one"}, "description": {"S": "Travel to the sea"}, "price": {"N": "500"}}'
aws dynamodb put-item \
    --table-name products \
    --item \
        '{"id": {"S": "d56d9b7c-fb93-4690-a13c-e6113c6a5ce3"}, "title": {"S": "Travel two"}, "description": {"S": "Travel to the mountains"}, "price": {"N": "400"}}'
aws dynamodb put-item \
    --table-name stocks \
    --item \
        '{"product_id": {"S": "ac335277-149b-4cb9-a51a-90a51bf819bb"}, "count": {"N": "1"}}'
aws dynamodb put-item \
    --table-name stocks \
    --item \
        '{"product_id": {"S": "3b4f6e07-d230-4c59-bdb7-7ec1da3d2733"}, "count": {"N": "4"}}'
aws dynamodb put-item \
    --table-name stocks \
    --item \
        '{"product_id": {"S": "d56d9b7c-fb93-4690-a13c-e6113c6a5ce3"}, "count": {"N": "3"}}'
