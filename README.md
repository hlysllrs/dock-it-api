# Dock It - a productivity API

Bring your projects to shore. 

[ERD](https://lucid.app/lucidchart/9608d3bf-48f0-48d7-8039-934127a4c259/edit?viewport_loc=592%2C-348%2C1536%2C816%2C0_0&invitationId=inv_9a6898c5-0a6a-4ddc-b97d-f27a32c17481)  
[Trello Board](https://trello.com/invite/b/WVUtxERw/ATTI8845271994a647d62d21ac2e8b3b3b672C9026CA/api-project)

## Running the Application
- clone repository
- must have node.js installed
- must have nodemon installed to use dev mode
- must create .env file containing the below information: 
    - `MONGO_URI` with MogngoDB connection string to connect to database
    - `PORT` with designated port for server connection
    - `SECREY_KEY` with secret code for decoding JWTs and passwords
- install required packages by running `npm i` in teh terminal