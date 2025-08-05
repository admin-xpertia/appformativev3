# Env files
## production.env

Contains the environment variables to be deployed within the Fargate instances that host this service. These variables act similar to the variables defined in `environment` attributes within docker-compose files, as such, they can be used within the service in the same fashion as Docker-defined variables.

## task_parameters.env

Contains infraestructure-level variables (e.g. Hardware resources per replica and/or per task)

The following table represents the valid CPU Unit / memory pair combinations for tasks hosted on Fargate

| CPU UNITS | MEMORY VALUES                      |   | vCPU      | MEMORY        |
|-----------|------------------------------------|---|-----------|---------------|
| 256       | 512 1024 2048                      |   | 0.25 vCPU | 0.5GB 1GB 2GB |
| 512       | 1024 2048 3072 4096                |   | 0.5 vCPU  | 1GB->4GB      |
| 1024      | 2048 3072 4096 5120 6144 7168 8192 |   | 1 vCPU    | 2GB->8GB      |
| 2048      | ...                                |   | 2 vCPU    | 4GB->16GB     |
| ...       | ...                                |   | ...       | ...           |

Reference
https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html
