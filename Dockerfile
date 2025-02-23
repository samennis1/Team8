FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

WORKDIR /backend

RUN apt-get update && apt-get install -y --no-install-recommends gcc

COPY backend/requirements.txt /backend/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend/ /backend/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
