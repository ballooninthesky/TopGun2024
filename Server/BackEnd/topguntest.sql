--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg120+1)
-- Dumped by pg_dump version 17.0 (Debian 17.0-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: mqtt_messages; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.mqtt_messages (
    id integer NOT NULL,
    text character varying(255) NOT NULL,
    received_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mqtt_messages OWNER TO admin;

--
-- Name: mqtt_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.mqtt_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mqtt_messages_id_seq OWNER TO admin;

--
-- Name: mqtt_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.mqtt_messages_id_seq OWNED BY public.mqtt_messages.id;


--
-- Name: voice_analysis; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.voice_analysis (
    id integer NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    predicted_gender character varying(10),
    confidence_score double precision
);


ALTER TABLE public.voice_analysis OWNER TO admin;

--
-- Name: voice_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.voice_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voice_analysis_id_seq OWNER TO admin;

--
-- Name: voice_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.voice_analysis_id_seq OWNED BY public.voice_analysis.id;


--
-- Name: waveform_data; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.waveform_data (
    id integer NOT NULL,
    audio_file_path text,
    spectrogram json,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.waveform_data OWNER TO admin;

--
-- Name: waveform_data_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.waveform_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waveform_data_id_seq OWNER TO admin;

--
-- Name: waveform_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.waveform_data_id_seq OWNED BY public.waveform_data.id;


--
-- Name: mqtt_messages id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.mqtt_messages ALTER COLUMN id SET DEFAULT nextval('public.mqtt_messages_id_seq'::regclass);


--
-- Name: voice_analysis id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.voice_analysis ALTER COLUMN id SET DEFAULT nextval('public.voice_analysis_id_seq'::regclass);


--
-- Name: waveform_data id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.waveform_data ALTER COLUMN id SET DEFAULT nextval('public.waveform_data_id_seq'::regclass);


--
-- Data for Name: mqtt_messages; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.mqtt_messages (id, text, received_at) FROM stdin;
\.


--
-- Data for Name: voice_analysis; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.voice_analysis (id, "timestamp", predicted_gender, confidence_score) FROM stdin;
1	2024-11-07 18:54:50	Male	0.98
2	2024-11-07 18:55:04	Female	0.96
3	2024-11-07 18:55:13	Female	0.8
4	2024-11-07 18:55:17	Female	0.88
5	2024-11-07 18:55:29	Male	0.94
6	2024-11-07 18:55:37	Male	0.79
\.


--
-- Data for Name: waveform_data; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.waveform_data (id, audio_file_path, spectrogram, "timestamp") FROM stdin;
\.


--
-- Name: mqtt_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.mqtt_messages_id_seq', 1, false);


--
-- Name: voice_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.voice_analysis_id_seq', 6, true);


--
-- Name: waveform_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.waveform_data_id_seq', 1, false);


--
-- Name: mqtt_messages mqtt_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.mqtt_messages
    ADD CONSTRAINT mqtt_messages_pkey PRIMARY KEY (id);


--
-- Name: voice_analysis voice_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.voice_analysis
    ADD CONSTRAINT voice_analysis_pkey PRIMARY KEY (id);


--
-- Name: waveform_data waveform_data_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.waveform_data
    ADD CONSTRAINT waveform_data_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

