FROM python:3
WORKDIR /app
COPY requirement.txt .
COPY api.py .
RUN pip install --no-cache-dir --upgrade pip && \
pip install --no-cache-dir -r requirement.txt
CMD ["python", "api.py"]