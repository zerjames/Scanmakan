-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 01, 2026 at 02:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `scanmakan`
--

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `id` varchar(100) NOT NULL,
  `name_id` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'makanan',
  `calories` double NOT NULL DEFAULT 0,
  `protein` double NOT NULL DEFAULT 0,
  `fat` double NOT NULL DEFAULT 0,
  `carbs` double NOT NULL DEFAULT 0,
  `serving_size` varchar(100) DEFAULT '',
  `source_url` varchar(500) DEFAULT NULL,
  `portions` text DEFAULT NULL,
  `portion_labels` text DEFAULT NULL,
  `portion_factors` text DEFAULT NULL,
  `variations` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`id`, `name_id`, `type`, `calories`, `protein`, `fat`, `carbs`, `serving_size`, `source_url`, `portions`, `portion_labels`, `portion_factors`, `variations`, `updated_at`) VALUES
('ayam_geprek', 'Ayam Geprek', 'makanan', 263, 21.61, 17.99, 7.6, '100g', 'https://www.fatsecret.co.id/kalori-gizi/umum/ayam-geprek?portionid=27502196&portionamount=100,000', '[\"penuh\"]', '{\"penuh\":\"1 Porsi\"}', '{\"penuh\":1}', '[{\"name\":\"1 Porsi\",\"serving_size\":\"300g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/ayam-geprek?portionid=27502195&portionamount=1,000\",\"calories\":789,\"protein\":52.82000000000000028421709430404007434844970703125,\"fat\":53.969999999999998863131622783839702606201171875,\"carbs\":22.809999999999998721023075631819665431976318359375}]', '2026-08-05 07:38:01'),
('bakso', 'Bakso Campur', 'makanan', 333, 32.75, 21.61, 0.46, '176g', 'https://www.fatsecret.co.id/kalori-gizi/umum/bakso-dengan-saus-(campuran)', '[\"penuh\",\"kecil\"]', '{\"penuh\":\"1 Porsi\",\"kecil\":\"Setengah Porsi\"}', '{\"penuh\":1,\"kecil\":0.5}', '[{\"name\":\"Mie bakso\",\"serving_size\":\"241g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/mie-bakso?portionid=10322466&portionamount=1,000\",\"calories\":388,\"protein\":20.239999999999998436805981327779591083526611328125,\"fat\":16.620000000000000994759830064140260219573974609375,\"carbs\":40.0499999999999971578290569595992565155029296875},{\"name\":\"Bakso Malang\",\"serving_size\":\"400g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/bakso-malang\",\"calories\":404,\"protein\":24.03999999999999914734871708787977695465087890625,\"fat\":16.030000000000001136868377216160297393798828125,\"carbs\":40.0799999999999982946974341757595539093017578125},{\"name\":\"Pentol\",\"serving_size\":\"120g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/pentol?portionid=7199038&portionamount=1,000\",\"calories\":323,\"protein\":16.489999999999998436805981327779591083526611328125,\"fat\":19.050000000000000710542735760100185871124267578125,\"carbs\":20.6700000000000017053025658242404460906982421875}]', '2026-08-05 07:33:45'),
('bubur_ayam', 'Bubur Ayam', 'makanan', 372, 27.56, 12.39, 36.12, '240g', 'https://www.fatsecret.co.id/kalori-gizi/umum/bubur-ayam', '[\"penuh\",\"sedang\"]', '{\"penuh\":\"Porsi Penuh\",\"sedang\":\"Porsi Sedang\"}', '{\"penuh\":1,\"sedang\":0.5}', '[{\"name\":\"Bubur Instan Rasa Ayam\",\"serving_size\":\"45g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/super-bubur\\/bubur-instan-rasa-ayam\\/1-porsi\",\"calories\":170,\"protein\":3,\"fat\":3,\"carbs\":32}]', '2026-08-05 07:39:49'),
('burger', 'Beef Burger', 'makanan', 258, 12.8, 7.7, 32.1, '102g', 'https://www.fatsecret.co.id/kalori-gizi/mcdonalds/beef-burger/1-porsi', '[\"penuh\"]', '{\"penuh\":\"1 Porsi\"}', '{\"penuh\":1}', '[{\"name\":\"Cheeseburger\",\"serving_size\":\"111g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/burger-king\\/cheeseburger\\/1-burger\",\"calories\":280,\"protein\":15,\"fat\":13,\"carbs\":27},{\"name\":\"Chicken Burger\",\"serving_size\":\"257g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/burger-king\\/chicken-burger\\/1-porsi\",\"calories\":480,\"protein\":22,\"fat\":25,\"carbs\":42}]', '2026-08-05 07:40:41'),
('dimsum', 'Dimsum', 'makanan', 112, 10.55, 2.64, 9.56, '180g', 'https://www.fatsecret.co.id/kalori-gizi/umum/dimsum?portionid=53605&portionamount=100,000', '[\"penuh\"]', '{\"penuh\":\"1 Porsi\"}', '{\"penuh\":1}', '[{\"name\":\"Dimsum Mentai\",\"serving_size\":\"200g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/dimsum-mentai?portionid=78425273&portionamount=1,000\",\"calories\":303,\"protein\":18.300000000000000710542735760100185871124267578125,\"fat\":12.3599999999999994315658113919198513031005859375,\"carbs\":28.8599999999999994315658113919198513031005859375}]', '2026-08-05 07:42:43'),
('kentang_goreng', 'Kentang Goreng', 'makanan', 274, 3.5, 14.1, 35.7, '100g', 'https://www.fatsecret.co.id/kalori-gizi/umum/kentang-goreng', '[\"penuh\"]', '{\"penuh\":\"1 Porsi\"}', '{\"penuh\":1}', '[]', '2026-08-05 07:50:43'),
('kopi_susu', 'Kopi Susu', 'minuman', 240, 0.33, 0.15, 0.84, '180ml', 'https://www.fatsecret.co.id/kalori-gizi/family-mart/es-kopi-susu-keluarga/1-glass', '[\"penuh\"]', '{\"penuh\":\"180ml\"}', '{\"penuh\":1}', '[]', '2026-08-05 07:55:44'),
('martabak_manis', 'Martabak Manis', 'makanan', 300, 7.78, 12.57, 41.52, '100g', 'https://www.fatsecret.co.id/kalori-gizi/umum/martabak-manis?portionid=11000827&portionamount=100,000', '[\"penuh\"]', '{\"penuh\":\"1 Potong\"}', '{\"penuh\":1}', '[]', '2026-08-05 07:57:04'),
('nasi_goreng', 'Nasi Goreng', 'makanan', 250, 9.39, 9.28, 31.38, '149g', 'https://www.fatsecret.co.id/kalori-gizi/umum/nasi-goreng?portionid=18686&portionamount=1,000', '[\"penuh\",\"kecil\"]', '{\"penuh\":\"1 Porsi\",\"kecil\":\"Setengah Porsi\"}', '{\"penuh\":1,\"kecil\":0.5}', '[]', '2026-08-05 07:58:10'),
('sate', 'Sate Ayam', 'makanan', 225, 19.54, 11.82, 4.87, '100g', 'https://www.fatsecret.co.id/kalori-gizi/umum/sate-ayam?portionid=4969313&portionamount=100,000', '[\"penuh\"]', '{\"penuh\":\"100g\"}', '{\"penuh\":1}', '[{\"name\":\"Sate Kambing\",\"serving_size\":\"100g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/sate-kambing?portionid=10322078&portionamount=100,000\",\"calories\":216,\"protein\":16.92999999999999971578290569595992565155029296875,\"fat\":14.0600000000000004973799150320701301097869873046875,\"carbs\":4.80999999999999960920149533194489777088165283203125}]', '2026-08-05 08:00:23'),
('seblak', 'Seblak', 'makanan', 262, 5.15, 13.31, 31.15, '200g', 'https://www.fatsecret.co.id/kalori-gizi/umum/seblak', '[\"penuh\",\"sedang\"]', '{\"penuh\":\"1 Porsi\",\"sedang\":\"\"}', '{\"penuh\":1,\"sedang\":0.5}', '[]', '2026-08-05 08:02:14'),
('teh', 'Teh', 'minuman', 55, 0, 0, 14.36, '178g', 'https://www.fatsecret.co.id/kalori-gizi/umum/teh-manis?portionid=11042878&portionamount=1,000', '[\"penuh\"]', '{\"penuh\":\"1 Gelas\"}', '{\"penuh\":1}', '[{\"name\":\"Es Teh\",\"serving_size\":\"240ml\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/es-teh\",\"calories\":90,\"protein\":-1.979999999999999982236431605997495353221893310546875,\"fat\":0,\"carbs\":23.440000000000001278976924368180334568023681640625,\"sugar\":0},{\"name\":\"Lemon Tea\",\"serving_size\":\"250g\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/lemon-tea?portionid=10262378&portionamount=1,000\",\"calories\":118,\"protein\":0.419999999999999984456877655247808434069156646728515625,\"fat\":0,\"carbs\":30.57000000000000028421709430404007434844970703125,\"sugar\":0},{\"name\":\"Teh Tawar\",\"serving_size\":\"240ml\",\"source_url\":\"https:\\/\\/www.fatsecret.co.id\\/kalori-gizi\\/umum\\/teh-tawar\",\"calories\":2,\"protein\":0.0200000000000000004163336342344337026588618755340576171875,\"fat\":0,\"carbs\":0.7600000000000000088817841970012523233890533447265625,\"sugar\":0}]', '2026-08-05 07:48:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `created_at`) VALUES
(1, 'admin@scanmakan.com', '$2a$12$KAk6dJvt.UerGMlXmXr7MOnr7D/D0imTD/caeXjNzfUeBTTQY9/TS', '2026-06-23 03:58:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
