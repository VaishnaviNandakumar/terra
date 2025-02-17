from etl.ai_service import ai_service

# products = ["NANDAKUMAR", "BLINKIT", "SWIGGY", "ZOMATO", "ABC RESTOBAR"]
# embeddings = ai_service.generate_embeddings(products)
# print(embeddings)
# ai_service.store_embeddings("sample_test", embeddings)

test_name = "VAISHNAVI NANDAKUMAR"
ai_service.find_closest_match(test_name)