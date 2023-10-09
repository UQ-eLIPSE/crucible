# UQ Crucible

Crucible is an online platform to centrally host and present learning materials to students with an easy-to-use interface.

## Getting Started

### Tech Stack

1. Node.JS 18
2. MongoDB
3. Vue 3
4. Express

## Client configuration

Before building the `client`, make sure that it is properly configured.

1. From project root directory, navigate to `client` directory
2. Duplicate `config.json.example` and rename the duplicated file `config.json`.
3. Modify the fields depending on the project, as demonstrated below
```javascript
{
    "BRANDING": {
        // Application name as appears on header and title
        "APP_NAME": "UQ Chemistry Resource Hub",

        // Welcome text that appears in center screen above root resources
        "HEADER_TEXT": "Welcome to the UQ Chemistry Resource Hub",

        // Number of splash images
        "NUM_SPLASH_IMAGES": 2
    },
    "QUIZ": {
        // Enables/disables intermediate step for quiz questions
        // For mech-001, this value should be `true`
        // For chemhub, this value should be false
        "ENABLE_INTERMEDIATE_PAGE": true
    },
    // Server address to send requests to
    "API_URL": "http://localhost:8080"
}
```


## Server Configuration
Below is an explanataion for what each of the variables in the config file are
```javascript
{
    "DATABASE": {
        "URI":          // URI to MongoDB database
    },
    "SERVER": {
        "PORT":         // Port for which the server instance will be attached to
    },
    "CLIENT": {
		"ADDRESS":      // Address of client
	},
    "MANTA": {
        "ENABLED":      // `true` to enable Manta, `false` to disable
        "HOST_URL":     // (1Password) Manta host URL eg. https://stluc.manta.uqcloud.net
        "HOST_FOLDER":  // (1Password) Main folder on Manta under which you'll be storing content
        "UPLOAD_SUBFOLDER": {
            "CONTENT":  // Name of `content` folder under "HOST_FOLDER"
            "THUMBNAIL":// Name of `thumbnail` folder under "HOST_FOLDER"
            "EDITOR_IMAGES": // Name of `editor-images` folder under "HOST_FOLDER"
        },
        "KEY_PATH":     // (1Password) Path to SSH key for signing requests to Manta 
        "KEY_ID":       // (1Password) Fingerprint of above SSH key 
        "USER":         // (1Password) User to use for requests to Manta
        "SUBUSER":      // (1Password) Subuser to use for requests to Manta (maybe `null`)
        "ROLES":        // (1Password) Array of roles to use for requests to Manta (maybe blank array)
    },
    "MANTA_OPERATION": {
        "JOB_CHECK_TRIES":      // Number of tries to check for job completion
    },
    "AUTH": {
        "SESSION_SECRET":       // Secret key for hashing the session
        "PASSWORD_HASH_ROUNDS": // Number of hash rounds the password goes through
        "UQSSO_SERVER_DOMAIN":  // The domain to represent the requests to UQ's SSO as (e.g. "crucible.uqcloud.net")
        "UQSSO_SERVER_PROTOCOL":// Protocol for the redirect URL on the client (e.g. "https")
    },
    "SESSION": {
        "COLLECTION":      // The collection which stores the session
        "EXPIRATION_TIME": // Time (in seconds) till the session will be stored. Default value is 14 days i.e. 14 * 24 * 60 * 60 = 1209600 seconds
    }
}
```
The server requires configuration before you begin. To do this:

1. From project root directory, navigate to `server/config`
2. Create a copy of `development.json.example` and rename copy to:
   - `development.json` for development
   - `production.json` for production
   - Make sure that config files are not committed back to the repository.
3. The Manta variables listed below in the config file can be found in a document called
    "Crucible VETS Manta Test Key" on 1Password
```javascript
{
"MANTA": {
    "HOST_URL":     // Manta host URL eg. https://stluc.manta.uqcloud.net
    "HOST_FOLDER":  // Main folder on Manta under which you'll be storing 
    "KEY_PATH":     // Path to SSH key for signing requests to Manta (replace file with your file name)
    "KEY_ID":       // Fingerprint of above SSH key 
    "USER":         // User to use for requests to Manta
    "SUBUSER":      // Subuser to use for requests to Manta (may be `null`)
    "ROLES":        // Array of roles to use for requests to Manta (may be blank array)
},
```

5. Download the key from the same document on 1Password
6. Create the folder /src/manta (if doesn't exist) and copy the key into this folder


## Building and Running

The application can be run either through Docker or starting the server and client individually

Before either method
Install packages using Yarn in both server and client.
### 1st method Docker

Run `docker-compose up --build` to run the application

### 2nd method Client

From project root directory:

```bash
cd client
yarn
yarn build       # For production
yarn build:dev   # For development
yarn watch       # For development
```

Client resources are then compiled to the `dist` folder under `client`; they are
served by the development server when switched on, and are expected to be served
by the web server on the production system.

### 2nd method Server

If you have not yet seeded the database, you must do so here. See _Database_
below for more information.

From project root directory:

```bash
cd server
yarn
yarn build
yarn start   # For production
yarn watch   # For development
```

ChemistryHub should now be running on `http://localhost:5173`

## Database

### Seeding the database/Importing collections

Collections can be imported into the database from a static mongo repository by running the following:

```bash
# Ensure the server is up and running

# Run the following command and follow the prompts
bash ./get_database.sh

# Requires you to log into Manta using your UQ username and complete the two factor authentication as needed
```

#### Default user

The default administrator user loaded with the database seed is: `admin` and the password can be found in 1Password under VETS Crucible password

#### Important

- **Do not** place any `.json` file in `server/util/db-seed` which is not a
  collection export. See _Export Collections_ for more info.

### Export collections

Make sure when you `mongoexport` and generate .json files, that the .json
filename is identical to the name of the collection (_Case Sensitive_)

E.g. For collection "Page" in database "crucible",

```batch
mongoexport --db crucible --collection Page --out Page.json
```

If you want this collection to persist for other developers, you can add the
exported .json file to `server/util/db-seed` and then commit. This will make
sure that when someone clones the repo, they can import your collection
successfully.

## Testing
To test the client 
```bash
cd client

# Utils and tools
yarn test:jest

# End to End testing using Cypress
yarn test:e2e

# Unit testing using Cypress
yarn test:unit        # Runs Cypress tests without opening
yarn test:unit:dev    # Opens Cypress in browsser

```

## Project specific
The default splash image is set to the SAFS image.

Depending on the project the splash image needs to be changed by following these steps

1. In `client/src/assets/splash-images`, add splash images and rename to `1`,`2`,`3`.\<extension\> to be consistent. SAFSHUB/VETSHUB and Fluid Dynamic images are located in `client/src/assets/splash-images/project-images`.
2. Then, these images will have to be added to the classes in the `Welcome.vue` component as follows: -

```css
.welcome.img0 {
  background-image: url(../assets/splash-images/1.<ext>);
}

.welcome.img1 {
  background-image: url(../assets/splash-images/2.<ext>);
}
```
## Notes

### Before Committing

- Properly review all changes and make sure the End of Line Sequence for all
  staged files is CRLF

### Workflow

- Project written in [TypeScript](https://www.typescriptlang.org) which
  transpiles to JavaScript
- Project implements centralized state management with
  [vuex](https://github.com/vuejs/vuex)
