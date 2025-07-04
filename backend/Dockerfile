# backend/Dockerfile

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

COPY models/latest/ models/latest/

# Expose port
EXPOSE 8000

ENV PREPROC_PATH=models/latest/recovery_preproc_with_user_bias.joblib
ENV MODEL_PATH=models/latest/recovery_mlp_with_user_bias.pt

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]