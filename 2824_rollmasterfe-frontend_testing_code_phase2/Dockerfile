# Use an official Node.js runtime as a parent image
FROM robrosystemsorg/source_containers:kwis_base_with_angular_3

# Install tzdata
RUN sudo apt-get update && sudo apt-get install -y tzdata

# Set the timezone to Indian Standard Time
ENV TZ=Asia/Kolkata

USER root

# Set the working directory inside the container
WORKDIR /home/Eve/catkin_ws

COPY src /home/Eve/catkin_ws/src

SHELL ["/bin/bash", "-c"]

RUN source /opt/ros/noetic/setup.bash && catkin_make && catkin_make install && rm -rf src build devel && sudo chmod +x install

RUN sudo pip3 install mysql-connector-python

COPY requirements.txt .

RUN pip3 install -r requirements.txt 

COPY 2824_rollmaster-RollMaster_backendcode_phase2/ /home/Eve/catkin_ws/backend_code/

WORKDIR /home/Eve/catkin_ws/backend_code/mysql_npm_module
RUN npm install
RUN npm run build

WORKDIR /home/Eve/catkin_ws/backend_code/
RUN npm install

WORKDIR /home/Eve/catkin_ws

# COPY 2824_rollmasterfe-frontend_testing_code_phase2/ /home/Eve/catkin_ws/frontend_code/

# WORKDIR /home/Eve/catkin_ws/frontend_code/

# RUN npm install --legacy-peer-deps

# WORKDIR /home/Eve/catkin_ws

RUN sudo chmod +x /home/Eve/catkin_ws/backend_code/launch_backend.sh

# RUN sudo chmod +x /home/Eve/catkin_ws/frontend_code/launch_frontend.sh
