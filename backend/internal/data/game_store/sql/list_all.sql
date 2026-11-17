SELECT g.game_id, g.domain_id, d.name AS domain_name, g.name, g.instructions
FROM game g
JOIN cognitive_domain d ON d.domain_id = g.domain_id
ORDER BY g.name
