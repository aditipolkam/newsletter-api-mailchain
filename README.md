## A newsletter API service 

Customize your newsletter UI as you want, however you want!

This service will handle all the logic, from creating your newsletter, to sending your updates to the subscriber base.

Server URL - `https://newsletter-api-mailchain.onrender.com`


### API endpoints

newsletters are mapped uniquely to a mailchain user address and hence `id` here specifies the newsletter creator's mailchain address, for eg: aditipolkam@mailchain.com

1. newsletter details: GET - /get-newsletter/:id
```shell
//response object example
{
    "id": "aditipolkam@mailchain.com", //string
    "name": "daily dose", //string
    "description": "business and tech", //string
    "launch": {
        "_seconds": 1681480240,
        "_nanoseconds": 428000000
    },   //Date
    "subscribers": [
        "raprocks@mailchain.com"
    ] //array
}

```
2.  subscribers for a newsletter: GET - /get-subscribers/:id
```shell
//response object example
{
    "subscribers": [
        "raprocks@mailchain.com"
    ]
}
```

3. subscribe to a newsletter: POST - subscribe-newsletter/:id
```shell
//example request
fetch(url,{
    method:POST,
    headers:{
        Content-Type:"application/json"
    },
    body:{
        mail:"raprocks@mailchain.com"
    }
})

//example response

```


4. send newsletter: POST - /send-newsletter/
```shell
//example request
fetch(url,{
    method:POST,
    headers:{
        Content-Type:"application/json",
        authorization: <YOUR_AUTH_TOKEN>,
        x-mailchain-messaging-key: <YOUR_MAILCHAIN_ACCOUNT_MESSAGING_KEY>
    },
    body:{
        mail:"raprocks@mailchain.com"
    }
})


```