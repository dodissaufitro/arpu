<?php

namespace Database\Factories;

use App\Models\ArpuSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ArpuSubscription>
 */
class ArpuSubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $operators = ['Telkomsel', 'Indosat', 'XL', 'Smartfren'];
        $services = ['Game Portal', 'Video Portal', 'Music Stream', 'News Update'];
        $adnets = ['AdMob', 'Unity', 'AppLovin', 'Vungle'];
        
        $subsDate = $this->faker->dateTimeBetween('-1 month', 'now');
        
        return [
            'country' => 'ID',
            'operator' => $this->faker->randomElement($operators),
            'id_operator' => $this->faker->numerify('OPR###'),
            'service' => $this->faker->randomElement($services),
            'keyword' => $this->faker->word(),
            'source' => $this->faker->randomElement(['web', 'wap', 'sms']),
            'msisdn' => '628' . $this->faker->numerify('#########'),
            'status' => $this->faker->randomElement(['active', 'active', 'active', 'inactive']),
            'cycle' => 'daily',
            'adnet' => $this->faker->randomElement($adnets),
            'revenue' => $this->faker->randomElement([2000, 5000, 10000, 15000]),
            'subs_date' => $subsDate->format('Y-m-d H:i:s'),
            'renewal_date' => (clone $subsDate)->modify('+1 day')->format('Y-m-d H:i:s'),
            'freemium_end_date' => null,
            'unsubs_from' => 'sms',
            'unsubs_date' => null,
            'service_price' => $this->faker->randomElement([2000, 5000, 10000, 15000]),
            'currency' => 'IDR',
            'profile_status' => 'active',
            'publisher' => $this->faker->company(),
            'trxid' => $this->faker->uuid(),
            'pixel' => 'NA',
            'handset' => 'Smartphone',
            'browser' => 'Chrome',
            'attempt_charging' => $this->faker->numberBetween(1, 3),
            'success_billing' => 1,
            'created_at' => now(),
        ];
    }
}
