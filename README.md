# Auth0 - Logs to Loggly

This extension will covert a public profile. Then 

`https://your_domain.auth0.com/profile/user_id` will respond the users public json profile 
and 
`https://your_domain.auth0.com/profifle/user_id/image` will redirect to the users profile image 


This extension is just a proof of concept, you should modify the `filter` function as per your requirements
and optionally you can add semi-public urls by adding `express-jwt` in the middlewares configured to allow 
tokens with appropiate configuration access to the public profiles.

## Configure Webtask

If you haven't configured Webtask on your machine run this first:

```
npm i -g wt-cli
wt init
```

> Requires at least node 0.10.40 - if you're running multiple version of node make sure to load the right version, e.g. "nvm use 0.10.40"

## Deploy to Auth0 Tenants

Please setup the extension by visiting https://manage.auth0.com/#/extensions and clicking create extension then run the following command

```bash
$ npm run build
$ wt create \
    --name auth0-public-profile \
    --secret AUTH0_DOMAIN="YOUR_AUTH0_DOMAIN" \
    --secret AUTH0_CLIENT_ID="YOUR_AUTH0_CLIENT_ID" \
    --secret AUTH0_CLIENT_SECRET="YOUR_AUTH0_CLIENT_SECRET" \
    --secret ERROR_IMAGE_URL="FAILOVER IMAGE"
    ./build/bundle.js
```

The Client ID and Client Secret should be created by creating a [Client](https://manage.auth0.com/#/clients) of Type "Non Interactive Client"
allowed to access Management API with scope `read:users`. We do not need any extra permissions for this extension.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, amont others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## Create a free Auth0 Account

1. Go to [Auth0](https://auth0.com) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
